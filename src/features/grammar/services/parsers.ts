import { GrammarDomainError } from '@/features/grammar/services/errors';
import {
  EXERCISE_CONTENT_SCHEMA_VERSION,
  GRAMMAR_COMPLETION_THRESHOLD,
  GRAMMAR_LEVELS,
  LESSON_CONTENT_SCHEMA_VERSION,
  type CompletedPracticeSession,
  type FillBlankAnswer,
  type FillBlankPayload,
  type GrammarExercise,
  type GrammarExerciseType,
  type GrammarLevel,
  type GrammarTopicSlug,
  type LessonContent,
  type MultipleChoiceAnswer,
  type MultipleChoicePayload,
  type PrivacyBoundedAnswerRecord,
  type SentenceOrderAnswer,
  type SentenceOrderPayload,
} from '@/features/grammar/types/content';
import {
  isGrammarTopicSlug,
  validateExercise,
  validateLessonContent,
} from '@/features/grammar/validation/content';

export type PublishedTopic = {
  id: string;
  slug: GrammarTopicSlug;
  title: string;
  description: string;
  sortOrder: number;
  lessonCount: number;
};

export type PublishedLesson = {
  id: string;
  topicId: string;
  slug: string;
  title: string;
  description: string;
  level: GrammarLevel;
  content: LessonContent;
  contentSchemaVersion: number;
  contentRevision: number;
  sortOrder: number;
};

export type PublishedExercise = {
  id: string;
  exerciseKey: string;
  topicId: string;
  lessonId: string;
  type: GrammarExerciseType;
  prompt: string;
  explanation: string;
  sortOrder: number;
  contentSchemaVersion: number;
  payload: MultipleChoicePayload | FillBlankPayload | SentenceOrderPayload;
  answer: MultipleChoiceAnswer | FillBlankAnswer | SentenceOrderAnswer;
};

export type LessonProgress = {
  lessonId: string;
  topicId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  bestScore: number;
  lastScore: number;
  lastActivityAt: string | null;
  completedAt: string | null;
};

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new GrammarDomainError('invalid_content', `Invalid ${field}`);
  }
  return value;
}

function requireInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new GrammarDomainError('invalid_content', `Invalid ${field}`);
  }
  return value;
}

export function parsePublishedTopic(row: Record<string, unknown>): PublishedTopic {
  const slug = requireString(row.slug, 'topic.slug');
  if (!isGrammarTopicSlug(slug)) {
    throw new GrammarDomainError('invalid_content', 'Unsupported topic slug');
  }
  if (row.published !== true) {
    throw new GrammarDomainError('invalid_content', 'Unpublished topic');
  }
  return {
    id: requireString(row.id, 'topic.id'),
    slug,
    title: requireString(row.title, 'topic.title'),
    description: requireString(row.description, 'topic.description'),
    sortOrder: requireInt(row.sort_order, 'topic.sort_order'),
    lessonCount:
      typeof row.lesson_count === 'number' &&
      Number.isInteger(row.lesson_count) &&
      row.lesson_count > 0
        ? row.lesson_count
        : GRAMMAR_LEVELS.length,
  };
}

export function parsePublishedLesson(row: Record<string, unknown>): PublishedLesson {
  if (row.published !== true) {
    throw new GrammarDomainError('invalid_content', 'Unpublished lesson');
  }
  const contentSchemaVersion = requireInt(row.content_schema_version, 'lesson.schema');
  if (contentSchemaVersion !== LESSON_CONTENT_SCHEMA_VERSION) {
    throw new GrammarDomainError('invalid_content', 'Unsupported lesson schema version');
  }
  const level = requireString(row.level, 'lesson.level');
  if (level !== 'A2' && level !== 'B1' && level !== 'B2' && level !== 'C1') {
    throw new GrammarDomainError('invalid_content', 'Invalid lesson level');
  }
  const content = row.content as LessonContent;
  const validated = validateLessonContent(content);
  if (!validated.ok) {
    throw new GrammarDomainError('invalid_content', validated.error);
  }
  return {
    id: requireString(row.id, 'lesson.id'),
    topicId: requireString(row.topic_id, 'lesson.topic_id'),
    slug: requireString(row.slug, 'lesson.slug'),
    title: requireString(row.title, 'lesson.title'),
    description: requireString(row.description, 'lesson.description'),
    level,
    content,
    contentSchemaVersion,
    contentRevision: requireInt(row.content_revision, 'lesson.revision'),
    sortOrder: requireInt(row.sort_order, 'lesson.sort_order'),
  };
}

export function parsePublishedExercise(row: Record<string, unknown>): PublishedExercise {
  if (row.published !== true) {
    throw new GrammarDomainError('invalid_content', 'Unpublished exercise');
  }
  const type = requireString(row.type, 'exercise.type') as GrammarExerciseType;
  const contentSchemaVersion = requireInt(row.content_schema_version, 'exercise.schema');
  if (contentSchemaVersion !== EXERCISE_CONTENT_SCHEMA_VERSION) {
    throw new GrammarDomainError('invalid_content', 'Unsupported exercise schema version');
  }

  const exerciseKey = requireString(row.exercise_key, 'exercise.key');
  const candidate = {
    id: exerciseKey,
    topicSlug: 'present-simple',
    lessonSlug: 'seed',
    type,
    prompt: requireString(row.prompt, 'exercise.prompt'),
    explanation: requireString(row.explanation, 'exercise.explanation'),
    sortOrder: requireInt(row.sort_order, 'exercise.sort_order'),
    contentSchemaVersion,
    payload: row.payload,
    answer: row.answer,
  } as GrammarExercise;

  const validated = validateExercise(candidate);
  if (!validated.ok) {
    throw new GrammarDomainError('invalid_content', validated.error);
  }

  return {
    id: requireString(row.id, 'exercise.id'),
    exerciseKey,
    topicId: requireString(row.topic_id, 'exercise.topic_id'),
    lessonId: requireString(row.lesson_id, 'exercise.lesson_id'),
    type,
    prompt: candidate.prompt,
    explanation: candidate.explanation,
    sortOrder: candidate.sortOrder,
    contentSchemaVersion,
    payload: row.payload as PublishedExercise['payload'],
    answer: row.answer as PublishedExercise['answer'],
  };
}

export function parseLessonProgress(row: Record<string, unknown>): LessonProgress {
  const status = requireString(row.status, 'progress.status');
  if (status !== 'not_started' && status !== 'in_progress' && status !== 'completed') {
    throw new GrammarDomainError('invalid_content', 'Invalid progress status');
  }
  return {
    lessonId: requireString(row.lesson_id, 'progress.lesson_id'),
    topicId: requireString(row.topic_id, 'progress.topic_id'),
    status,
    bestScore: requireInt(row.best_score, 'progress.best_score'),
    lastScore: requireInt(row.last_score, 'progress.last_score'),
    lastActivityAt: typeof row.last_activity_at === 'string' ? row.last_activity_at : null,
    completedAt: typeof row.completed_at === 'string' ? row.completed_at : null,
  };
}

function parsePrivacyBoundedAnswers(value: unknown): PrivacyBoundedAnswerRecord[] {
  if (!Array.isArray(value)) {
    throw new GrammarDomainError('invalid_content', 'Invalid attempt answers');
  }
  return value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new GrammarDomainError('invalid_content', `Invalid answer at ${index}`);
    }
    const row = item as Record<string, unknown>;
    const exerciseId = requireString(row.exerciseId, `answers[${index}].exerciseId`);
    const correct = row.correct === true;
    const skipped = row.skipped === true;
    const selectedIds = Array.isArray(row.selectedIds)
      ? row.selectedIds.filter((id): id is string => typeof id === 'string')
      : undefined;
    return {
      exerciseId,
      correct,
      ...(selectedIds && selectedIds.length > 0 ? { selectedIds } : {}),
      ...(skipped ? { skipped: true } : {}),
    };
  });
}

export function parseGrammarAttempt(row: Record<string, unknown>): CompletedPracticeSession {
  const score = requireInt(row.score, 'attempt.score');
  return {
    clientAttemptId: requireString(row.client_attempt_id, 'attempt.client_attempt_id'),
    topicId: requireString(row.topic_id, 'attempt.topic_id'),
    lessonId: requireString(row.lesson_id, 'attempt.lesson_id'),
    contentRevision: requireInt(row.content_revision, 'attempt.content_revision'),
    correctCount: requireInt(row.correct_count, 'attempt.correct_count'),
    totalCount: requireInt(row.total_count, 'attempt.total_count'),
    score,
    completed: score >= GRAMMAR_COMPLETION_THRESHOLD,
    answers: parsePrivacyBoundedAnswers(row.answers),
    startedAt: requireString(row.started_at, 'attempt.started_at'),
    completedAt: requireString(row.completed_at, 'attempt.completed_at'),
  };
}
