import AsyncStorage from '@react-native-async-storage/async-storage';

import { GrammarDomainError } from '@/features/grammar/services/errors';
import type {
  LessonProgress,
  PublishedExercise,
  PublishedLesson,
  PublishedTopic,
} from '@/features/grammar/services/parsers';
import {
  EXERCISE_CONTENT_SCHEMA_VERSION,
  GRAMMAR_COMPLETION_THRESHOLD,
  GRAMMAR_CURRICULUM_VERSION,
  GRAMMAR_OPTIONAL_TOPIC_SLUGS,
  GRAMMAR_TOPIC_CATEGORY,
  LESSON_CONTENT_SCHEMA_VERSION,
  type GrammarCategorySlug,
  type GrammarLevel,
  type GrammarTopicSlug,
} from '@/features/grammar/types/content';
import {
  isGrammarTopicSlug,
  validateExercise,
  validateLessonContent,
} from '@/features/grammar/validation/content';

import packsJson from '../../../../supabase/seed/grammar/packs-v2.json';

type PackLesson = {
  key: string;
  level: GrammarLevel;
  title: string;
  description: string;
  usage: string;
  forms: { affirmative: string; negative: string; question: string };
  exampleSentences: [string, string][];
  tips: string[];
};

type PackExercise = {
  id: string;
  lessonKey: string;
  type: 'multiple_choice' | 'fill_blank' | 'sentence_order';
  prompt: string;
  explanation: string;
  payload: Record<string, unknown>;
  answer: Record<string, unknown>;
};

type Pack = {
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
  categorySlug?: GrammarCategorySlug;
  curriculumVersion?: number;
  isOptional?: boolean;
  lessons: PackLesson[];
  exercises: PackExercise[];
};

type LocalCatalog = {
  topics: PublishedTopic[];
  lessonsByTopicId: Map<string, PublishedLesson[]>;
  lessonById: Map<string, PublishedLesson>;
  exercisesByLessonId: Map<string, PublishedExercise[]>;
};

const LOCAL_PROGRESS_KEY = '@tanlabs/grammar_local_progress_v2';

let cached: LocalCatalog | null = null;
const localProgressByLessonId = new Map<string, LessonProgress>();
let progressHydrated = false;
let progressHydratePromise: Promise<void> | null = null;

function padId(prefix: string, n: number): string {
  return `${prefix}${String(n).padStart(12, '0')}`;
}

function buildCatalog(packs: Pack[]): LocalCatalog {
  const topics: PublishedTopic[] = [];
  const lessonsByTopicId = new Map<string, PublishedLesson[]>();
  const lessonById = new Map<string, PublishedLesson>();
  const exercisesByLessonId = new Map<string, PublishedExercise[]>();
  let lessonCounter = 0;
  let exerciseCounter = 0;

  packs.forEach((pack, topicIndex) => {
    if (!isGrammarTopicSlug(pack.slug)) {
      throw new GrammarDomainError('invalid_content', `Unsupported preview slug: ${pack.slug}`);
    }
    const topicId = padId('a1000000-0000-4000-8000-', topicIndex + 1);
    const lessonIdByKey = new Map<string, string>();
    const topicLessons: PublishedLesson[] = [];

    pack.lessons.forEach((lesson, lessonIndex) => {
      lessonCounter += 1;
      const lessonId = padId('a2000000-0000-4000-8000-', lessonCounter);
      const content = {
        usage: lesson.usage,
        forms: lesson.forms,
        examples: lesson.exampleSentences.map(([context, sentence], exampleIndex) => ({
          id: `ex-${exampleIndex + 1}`,
          context,
          sentence,
        })),
        tips: lesson.tips,
      };
      const validated = validateLessonContent(content);
      if (!validated.ok) {
        throw new GrammarDomainError(
          'invalid_content',
          `Preview lesson ${pack.slug}/${lesson.key}: ${validated.error}`,
        );
      }
      const row: PublishedLesson = {
        id: lessonId,
        topicId,
        slug: `${pack.slug}-${lesson.key}`,
        title: lesson.title,
        description: lesson.description,
        level: lesson.level,
        content,
        contentSchemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
        contentRevision: 1,
        sortOrder: lessonIndex + 1,
      };
      lessonIdByKey.set(lesson.key, lessonId);
      topicLessons.push(row);
      lessonById.set(lessonId, row);
      exercisesByLessonId.set(lessonId, []);
    });

    const slug = pack.slug as GrammarTopicSlug;
    const topic: PublishedTopic = {
      id: topicId,
      slug,
      title: pack.title,
      description: pack.description,
      sortOrder: pack.sortOrder,
      lessonCount: topicLessons.length,
      categorySlug: pack.categorySlug ?? GRAMMAR_TOPIC_CATEGORY[slug],
      curriculumVersion: pack.curriculumVersion ?? GRAMMAR_CURRICULUM_VERSION,
      isOptional:
        pack.isOptional ?? (GRAMMAR_OPTIONAL_TOPIC_SLUGS as readonly string[]).includes(slug),
    };
    topics.push(topic);
    lessonsByTopicId.set(topicId, topicLessons);

    pack.exercises.forEach((exercise, exerciseIndex) => {
      const lessonId = lessonIdByKey.get(exercise.lessonKey);
      if (!lessonId) {
        throw new GrammarDomainError(
          'invalid_content',
          `Preview exercise ${exercise.id}: unknown lessonKey`,
        );
      }
      const lesson = lessonById.get(lessonId)!;
      const asExercise = {
        id: exercise.id,
        topicSlug: topic.slug,
        lessonSlug: lesson.slug,
        type: exercise.type,
        prompt: exercise.prompt,
        explanation: exercise.explanation,
        sortOrder: exerciseIndex + 1,
        contentSchemaVersion: EXERCISE_CONTENT_SCHEMA_VERSION,
        payload: exercise.payload,
        answer: exercise.answer,
      } as const;
      const validated = validateExercise(asExercise as never);
      if (!validated.ok) {
        throw new GrammarDomainError(
          'invalid_content',
          `Preview exercise ${exercise.id}: ${validated.error}`,
        );
      }
      exerciseCounter += 1;
      const published: PublishedExercise = {
        id: padId('a3000000-0000-4000-8000-', exerciseCounter),
        exerciseKey: exercise.id,
        topicId,
        lessonId,
        type: exercise.type,
        prompt: exercise.prompt,
        explanation: exercise.explanation,
        sortOrder: exerciseIndex + 1,
        contentSchemaVersion: EXERCISE_CONTENT_SCHEMA_VERSION,
        payload: exercise.payload as PublishedExercise['payload'],
        answer: exercise.answer as PublishedExercise['answer'],
      };
      exercisesByLessonId.get(lessonId)!.push(published);
    });
  });

  return { topics, lessonsByTopicId, lessonById, exercisesByLessonId };
}

function catalog(): LocalCatalog {
  if (!cached) {
    cached = buildCatalog(packsJson as unknown as Pack[]);
  }
  return cached;
}

export function buildLocalSeedCatalogForTests(packs: unknown): LocalCatalog {
  cached = buildCatalog(packs as Pack[]);
  return cached;
}

export function resetLocalSeedCatalogForTests(): void {
  cached = null;
}

function catalogOrThrow(): LocalCatalog {
  return catalog();
}

export function listLocalTopics(): PublishedTopic[] {
  return catalogOrThrow().topics;
}

export function getLocalTopic(topicId: string): PublishedTopic {
  const topic = catalog().topics.find((row) => row.id === topicId);
  if (!topic) {
    throw new GrammarDomainError('not_found', 'Topic not found.');
  }
  return topic;
}

export function listLocalLessonsByTopic(topicId: string): PublishedLesson[] {
  getLocalTopic(topicId);
  return catalog().lessonsByTopicId.get(topicId) ?? [];
}

export function getLocalLesson(lessonId: string): PublishedLesson {
  const lesson = catalog().lessonById.get(lessonId);
  if (!lesson) {
    throw new GrammarDomainError('not_found', 'Lesson not found.');
  }
  return lesson;
}

export function listLocalExercisesByLesson(lessonId: string): PublishedExercise[] {
  getLocalLesson(lessonId);
  return catalog().exercisesByLessonId.get(lessonId) ?? [];
}

export function listAllLocalLessons(): PublishedLesson[] {
  const cat = catalogOrThrow();
  return cat.topics.flatMap((topic) => cat.lessonsByTopicId.get(topic.id) ?? []);
}

async function ensureProgressHydrated(): Promise<void> {
  if (progressHydrated) {
    return;
  }
  if (!progressHydratePromise) {
    progressHydratePromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(LOCAL_PROGRESS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as LessonProgress[];
          if (Array.isArray(parsed)) {
            localProgressByLessonId.clear();
            for (const row of parsed) {
              if (row?.lessonId) {
                localProgressByLessonId.set(row.lessonId, row);
              }
            }
          }
        }
      } catch {
      } finally {
        progressHydrated = true;
      }
    })();
  }
  await progressHydratePromise;
}

async function persistLocalProgress(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      LOCAL_PROGRESS_KEY,
      JSON.stringify([...localProgressByLessonId.values()]),
    );
  } catch {}
}

export async function listLocalProgress(): Promise<LessonProgress[]> {
  await ensureProgressHydrated();
  return [...localProgressByLessonId.values()];
}

export async function getLocalLessonProgress(lessonId: string): Promise<LessonProgress | null> {
  await ensureProgressHydrated();
  return localProgressByLessonId.get(lessonId) ?? null;
}

export async function recordLocalProgressAttempt(input: {
  topicId: string;
  lessonId: string;
  score: number;
  completedAt: string;
}): Promise<LessonProgress> {
  await ensureProgressHydrated();
  const previous = localProgressByLessonId.get(input.lessonId);
  const bestScore = Math.max(previous?.bestScore ?? 0, input.score);
  const completed = bestScore >= GRAMMAR_COMPLETION_THRESHOLD || previous?.status === 'completed';
  const next: LessonProgress = {
    lessonId: input.lessonId,
    topicId: input.topicId,
    status: completed ? 'completed' : 'in_progress',
    bestScore,
    lastScore: input.score,
    lastActivityAt: input.completedAt,
    completedAt: completed ? previous?.completedAt ?? input.completedAt : null,
  };
  localProgressByLessonId.set(input.lessonId, next);
  await persistLocalProgress();
  return next;
}

export function resetLocalProgressForTests(): void {
  localProgressByLessonId.clear();
  progressHydrated = true;
  progressHydratePromise = null;
}
