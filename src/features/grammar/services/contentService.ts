import { GRAMMAR_FORCE_LOCAL_SEED } from '@/app/config/env';
import { recordError } from '@/core/monitoring/crashlytics';
import { supabase } from '@/core/supabase/client';
import { GrammarDomainError, toGrammarDomainError } from '@/features/grammar/services/errors';
import { loadLocalSeedCatalog } from '@/features/grammar/services/localSeedLoader';
import {
  parseGrammarAttempt,
  parseLessonProgress,
  parsePublishedExercise,
  parsePublishedLesson,
  parsePublishedTopic,
  type LessonProgress,
  type PublishedExercise,
  type PublishedLesson,
  type PublishedTopic,
} from '@/features/grammar/services/parsers';
import type { CompletedPracticeSession } from '@/features/grammar/types/content';
import type { Json } from '@/types/database';

async function noteInvalid(error: unknown, context: string): Promise<void> {
  if (error instanceof GrammarDomainError && error.code === 'invalid_content') {
    await recordError(new Error(`grammar.invalid_content:${context}`));
  }
}

export async function getTopics(): Promise<PublishedTopic[]> {
  if (GRAMMAR_FORCE_LOCAL_SEED) {
    const local = await loadLocalSeedCatalog();
    return local.listLocalTopics();
  }
  try {
    const { data, error } = await supabase
      .from('grammar_topics')
      .select('id, slug, title, description, sort_order, published')
      .eq('published', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    const { data: lessonRows, error: lessonError } = await supabase
      .from('grammar_lessons')
      .select('topic_id')
      .eq('published', true);

    if (lessonError) {
      throw lessonError;
    }

    const lessonCountByTopic = new Map<string, number>();
    for (const row of lessonRows ?? []) {
      const topicId = (row as { topic_id: string }).topic_id;
      lessonCountByTopic.set(topicId, (lessonCountByTopic.get(topicId) ?? 0) + 1);
    }

    const topics: PublishedTopic[] = [];
    for (const row of data ?? []) {
      try {
        const record = row as Record<string, unknown>;
        topics.push(
          parsePublishedTopic({
            ...record,
            lesson_count: lessonCountByTopic.get(String(record.id)) ?? undefined,
          }),
        );
      } catch (parseError) {
        await noteInvalid(parseError, 'topic');
      }
    }
    return topics;
  } catch (error) {
    throw toGrammarDomainError(error);
  }
}

export async function getTopic(topicId: string): Promise<PublishedTopic> {
  if (GRAMMAR_FORCE_LOCAL_SEED) {
    const local = await loadLocalSeedCatalog();
    return local.getLocalTopic(topicId);
  }
  try {
    const { data, error } = await supabase
      .from('grammar_topics')
      .select('id, slug, title, description, sort_order, published')
      .eq('id', topicId)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      throw new GrammarDomainError('not_found', 'Topic not found.');
    }

    const { count, error: countError } = await supabase
      .from('grammar_lessons')
      .select('id', { count: 'exact', head: true })
      .eq('topic_id', topicId)
      .eq('published', true);

    if (countError) {
      throw countError;
    }

    return parsePublishedTopic({
      ...(data as Record<string, unknown>),
      lesson_count: typeof count === 'number' ? count : undefined,
    });
  } catch (error) {
    if (error instanceof GrammarDomainError) {
      throw error;
    }
    throw toGrammarDomainError(error);
  }
}

export async function getLessonsByTopic(topicId: string): Promise<PublishedLesson[]> {
  if (GRAMMAR_FORCE_LOCAL_SEED) {
    const local = await loadLocalSeedCatalog();
    return local.listLocalLessonsByTopic(topicId);
  }
  try {
    const { data, error } = await supabase
      .from('grammar_lessons')
      .select(
        'id, topic_id, slug, title, description, level, content, content_schema_version, content_revision, sort_order, published',
      )
      .eq('topic_id', topicId)
      .eq('published', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    const lessons: PublishedLesson[] = [];
    for (const row of data ?? []) {
      try {
        lessons.push(parsePublishedLesson(row as Record<string, unknown>));
      } catch (parseError) {
        await noteInvalid(parseError, 'lesson');
      }
    }
    return lessons;
  } catch (error) {
    throw toGrammarDomainError(error);
  }
}

export async function getAllPublishedLessons(): Promise<PublishedLesson[]> {
  if (GRAMMAR_FORCE_LOCAL_SEED) {
    const local = await loadLocalSeedCatalog();
    return local.listAllLocalLessons();
  }
  try {
    const { data, error } = await supabase
      .from('grammar_lessons')
      .select(
        'id, topic_id, slug, title, description, level, content, content_schema_version, content_revision, sort_order, published',
      )
      .eq('published', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    const lessons: PublishedLesson[] = [];
    for (const row of data ?? []) {
      try {
        lessons.push(parsePublishedLesson(row as Record<string, unknown>));
      } catch (parseError) {
        await noteInvalid(parseError, 'lesson');
      }
    }
    return lessons;
  } catch (error) {
    throw toGrammarDomainError(error);
  }
}

export async function getGrammarAttemptByClientId(
  userId: string,
  clientAttemptId: string,
): Promise<CompletedPracticeSession | null> {
  if (GRAMMAR_FORCE_LOCAL_SEED) {
    return null;
  }
  try {
    if (!userId) {
      throw new GrammarDomainError('unauthorized', 'Sign in to load Grammar attempts.');
    }
    const { data, error } = await supabase
      .from('grammar_attempts')
      .select(
        'client_attempt_id, topic_id, lesson_id, content_revision, correct_count, total_count, score, answers, started_at, completed_at',
      )
      .eq('user_id', userId)
      .eq('client_attempt_id', clientAttemptId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }
    return parseGrammarAttempt(data as Record<string, unknown>);
  } catch (error) {
    throw toGrammarDomainError(error);
  }
}

export async function getLesson(lessonId: string): Promise<PublishedLesson> {
  if (GRAMMAR_FORCE_LOCAL_SEED) {
    const local = await loadLocalSeedCatalog();
    return local.getLocalLesson(lessonId);
  }
  try {
    const { data, error } = await supabase
      .from('grammar_lessons')
      .select(
        'id, topic_id, slug, title, description, level, content, content_schema_version, content_revision, sort_order, published',
      )
      .eq('id', lessonId)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      throw new GrammarDomainError('not_found', 'Lesson not found.');
    }
    return parsePublishedLesson(data as Record<string, unknown>);
  } catch (error) {
    if (error instanceof GrammarDomainError) {
      throw error;
    }
    throw toGrammarDomainError(error);
  }
}

export async function getExercisesByLesson(lessonId: string): Promise<PublishedExercise[]> {
  if (GRAMMAR_FORCE_LOCAL_SEED) {
    const local = await loadLocalSeedCatalog();
    return local.listLocalExercisesByLesson(lessonId);
  }
  try {
    const { data, error } = await supabase
      .from('grammar_exercises')
      .select(
        'id, topic_id, lesson_id, exercise_key, type, prompt, payload, answer, explanation, content_schema_version, sort_order, published',
      )
      .eq('lesson_id', lessonId)
      .eq('published', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    const exercises: PublishedExercise[] = [];
    for (const row of data ?? []) {
      try {
        exercises.push(parsePublishedExercise(row as Record<string, unknown>));
      } catch (parseError) {
        await noteInvalid(parseError, 'exercise');
      }
    }
    return exercises;
  } catch (error) {
    throw toGrammarDomainError(error);
  }
}

export async function getProgressForUser(userId: string): Promise<LessonProgress[]> {
  if (GRAMMAR_FORCE_LOCAL_SEED) {
    if (!userId) {
      throw new GrammarDomainError('unauthorized', 'Sign in to load Grammar progress.');
    }
    const local = await loadLocalSeedCatalog();
    return await local.listLocalProgress();
  }
  try {
    if (!userId) {
      throw new GrammarDomainError('unauthorized', 'Sign in to load Grammar progress.');
    }
    const { data, error } = await supabase
      .from('user_grammar_progress')
      .select('lesson_id, topic_id, status, best_score, last_score, last_activity_at, completed_at')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const rows: LessonProgress[] = [];
    for (const row of data ?? []) {
      try {
        rows.push(parseLessonProgress(row as Record<string, unknown>));
      } catch (parseError) {
        await noteInvalid(parseError, 'progress');
      }
    }
    return rows;
  } catch (error) {
    throw toGrammarDomainError(error);
  }
}

export async function getLessonProgress(
  userId: string,
  lessonId: string,
): Promise<LessonProgress | null> {
  if (GRAMMAR_FORCE_LOCAL_SEED) {
    if (!userId) {
      throw new GrammarDomainError('unauthorized', 'Sign in to load Grammar progress.');
    }
    const local = await loadLocalSeedCatalog();
    return await local.getLocalLessonProgress(lessonId);
  }
  try {
    if (!userId) {
      throw new GrammarDomainError('unauthorized', 'Sign in to load Grammar progress.');
    }
    const { data, error } = await supabase
      .from('user_grammar_progress')
      .select('lesson_id, topic_id, status, best_score, last_score, last_activity_at, completed_at')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }
    return parseLessonProgress(data as Record<string, unknown>);
  } catch (error) {
    throw toGrammarDomainError(error);
  }
}

export type CompleteGrammarAttemptInput = {
  clientAttemptId: string;
  topicId: string;
  lessonId: string;
  contentRevision: number;
  correctCount: number;
  totalCount: number;
  score: number;
  answers: unknown[];
  startedAt: string;
  completedAt: string;
};

export async function completeGrammarAttempt(
  userId: string,
  input: CompleteGrammarAttemptInput,
): Promise<void> {
  if (!userId) {
    throw new GrammarDomainError('unauthorized', 'Sign in to save Grammar progress.');
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    throw new GrammarDomainError('unauthorized', 'Sign in to save your progress.');
  }
  if (data.user.id !== userId) {
    throw new GrammarDomainError(
      'unauthorized',
      'Session changed. Sign in again to save progress.',
    );
  }
  if (GRAMMAR_FORCE_LOCAL_SEED) {
    const local = await loadLocalSeedCatalog();
    await local.recordLocalProgressAttempt({
      topicId: input.topicId,
      lessonId: input.lessonId,
      score: input.score,
      completedAt: input.completedAt,
    });
    return;
  }
  try {
    const { error: rpcError } = await supabase.rpc('complete_grammar_attempt', {
      p_client_attempt_id: input.clientAttemptId,
      p_topic_id: input.topicId,
      p_lesson_id: input.lessonId,
      p_content_revision: input.contentRevision,
      p_correct_count: input.correctCount,
      p_total_count: input.totalCount,
      p_score: input.score,
      p_answers: input.answers as Json,
      p_started_at: input.startedAt,
      p_completed_at: input.completedAt,
    });
    if (rpcError) {
      throw rpcError;
    }
  } catch (caught) {
    throw toGrammarDomainError(caught);
  }
}
