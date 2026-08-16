import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/core/auth/AuthProvider';
import { grammarKeys } from '@/features/grammar/hooks/queryKeys';
import {
  grammarCompletionMutationKey,
  runCompleteGrammarAttempt,
  type GrammarCompletionMutationInput,
} from '@/features/grammar/mutations';
import {
  getAllPublishedLessons,
  getExercisesByLesson,
  getGrammarAttemptByClientId,
  getLesson,
  getLessonProgress,
  getLessonsByTopic,
  getProgressForUser,
  getTopic,
  getTopics,
} from '@/features/grammar/services';
import { usePracticeSession } from '@/features/grammar/session';
import { loadCompletedSession } from '@/features/grammar/session/completedSessionCache';
import { pickGlobalContinueLearning } from '@/features/grammar/utils/continueLearning';

const CONTENT_STALE_MS = 5 * 60 * 1000;

export function useGrammarTopics() {
  return useQuery({
    queryKey: grammarKeys.topics(),
    queryFn: getTopics,
    staleTime: CONTENT_STALE_MS,
  });
}

export function useGrammarTopic(topicId: string | undefined) {
  return useQuery({
    queryKey: grammarKeys.topic(topicId ?? ''),
    enabled: Boolean(topicId),
    queryFn: () => getTopic(topicId as string),
    staleTime: CONTENT_STALE_MS,
  });
}

export function useGrammarLessons(topicId: string | undefined) {
  return useQuery({
    queryKey: grammarKeys.lessons(topicId ?? ''),
    enabled: Boolean(topicId),
    queryFn: () => getLessonsByTopic(topicId as string),
    staleTime: CONTENT_STALE_MS,
  });
}

export function useGrammarLesson(lessonId: string | undefined) {
  return useQuery({
    queryKey: grammarKeys.lesson(lessonId ?? ''),
    enabled: Boolean(lessonId),
    queryFn: () => getLesson(lessonId as string),
    staleTime: CONTENT_STALE_MS,
  });
}

export function useGrammarExercises(lessonId: string | undefined) {
  return useQuery({
    queryKey: grammarKeys.exercises(lessonId ?? ''),
    enabled: Boolean(lessonId),
    queryFn: () => getExercisesByLesson(lessonId as string),
    staleTime: CONTENT_STALE_MS,
  });
}

export function useGrammarProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: grammarKeys.progress(user?.id ?? ''),
    enabled: Boolean(user?.id),
    queryFn: () => getProgressForUser(user!.id),
  });
}

export function useGrammarContinueLearning() {
  const { user } = useAuth();
  const topicsQuery = useGrammarTopics();
  const progressQuery = useGrammarProgress();
  const allLessonsQuery = useQuery({
    queryKey: grammarKeys.allLessons(),
    queryFn: getAllPublishedLessons,
    staleTime: CONTENT_STALE_MS,
    enabled: topicsQuery.isSuccess,
  });

  const topics = useMemo(() => topicsQuery.data ?? [], [topicsQuery.data]);
  const progressReady = !user?.id || progressQuery.isFetched;

  const target = useMemo(() => {
    if (!topicsQuery.isSuccess || !allLessonsQuery.isSuccess || !progressReady) {
      return null;
    }
    const lessonsByTopicId = new Map<string, Array<{ id: string; sortOrder: number }>>();
    for (const lesson of allLessonsQuery.data ?? []) {
      const rows = lessonsByTopicId.get(lesson.topicId) ?? [];
      rows.push({ id: lesson.id, sortOrder: lesson.sortOrder });
      lessonsByTopicId.set(lesson.topicId, rows);
    }
    for (const [topicId, rows] of lessonsByTopicId) {
      rows.sort((a, b) => a.sortOrder - b.sortOrder);
      lessonsByTopicId.set(topicId, rows);
    }
    return pickGlobalContinueLearning(
      topics.map((topic) => ({
        id: topic.id,
        sortOrder: topic.sortOrder,
        isOptional: topic.isOptional,
      })),
      lessonsByTopicId,
      (progressQuery.data ?? []).map((row) => ({
        topicId: row.topicId,
        lessonId: row.lessonId,
        status: row.status,
        lastActivityAt: row.lastActivityAt,
      })),
    );
  }, [
    allLessonsQuery.data,
    allLessonsQuery.isSuccess,
    progressQuery.data,
    progressReady,
    topics,
    topicsQuery.isSuccess,
  ]);

  const lessonTitleById = useMemo(
    () => new Map((allLessonsQuery.data ?? []).map((lesson) => [lesson.id, lesson.title])),
    [allLessonsQuery.data],
  );

  const topicTitleById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic.title])),
    [topics],
  );

  const lessonPosition = useMemo(() => {
    if (!target) {
      return null;
    }
    const lessons = (allLessonsQuery.data ?? [])
      .filter((lesson) => lesson.topicId === target.topicId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = lessons.findIndex((lesson) => lesson.id === target.lessonId);
    return {
      current: index >= 0 ? index + 1 : 1,
      total: Math.max(lessons.length, 1),
    };
  }, [allLessonsQuery.data, target]);

  return {
    target,
    topicTitle: target ? topicTitleById.get(target.topicId) : undefined,
    lessonTitle: target ? lessonTitleById.get(target.lessonId) : undefined,
    lessonPosition,
    isLoading:
      topicsQuery.isLoading ||
      allLessonsQuery.isLoading ||
      Boolean(user?.id && progressQuery.isLoading),
    isReady: topicsQuery.isSuccess && allLessonsQuery.isSuccess && progressReady,
  };
}

export function useGrammarLessonProgress(lessonId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: grammarKeys.lessonProgress(user?.id ?? '', lessonId ?? ''),
    enabled: Boolean(user?.id && lessonId),
    queryFn: () => getLessonProgress(user!.id, lessonId as string),
  });
}

export function useGrammarResultSession(clientAttemptId: string | undefined) {
  const { user } = useAuth();
  const { getCompletedSession } = usePracticeSession();
  const inMemory = clientAttemptId ? getCompletedSession(clientAttemptId) : null;

  const cacheQuery = useQuery({
    queryKey: grammarKeys.completedSession(clientAttemptId ?? ''),
    queryFn: () => loadCompletedSession(clientAttemptId as string),
    enabled: Boolean(clientAttemptId) && !inMemory,
    staleTime: Infinity,
  });

  const cached = cacheQuery.data ?? null;
  const serverQuery = useQuery({
    queryKey: grammarKeys.attempt(user?.id ?? '', clientAttemptId ?? ''),
    queryFn: () => getGrammarAttemptByClientId(user!.id, clientAttemptId as string),
    enabled: Boolean(user?.id && clientAttemptId) && !inMemory && !cached,
    staleTime: CONTENT_STALE_MS,
  });

  const session = inMemory ?? cached ?? serverQuery.data ?? null;
  const isLoading =
    !inMemory &&
    Boolean(clientAttemptId) &&
    (cacheQuery.isLoading || (cacheQuery.isFetched && !cached && serverQuery.isLoading));

  return { session, isLoading };
}

export function useCompleteGrammarAttempt() {
  return useMutation({
    mutationKey: grammarCompletionMutationKey,
    mutationFn: runCompleteGrammarAttempt,
    networkMode: 'online',
  });
}

export type { GrammarCompletionMutationInput };
