import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuth } from '@/core/auth/AuthProvider';
import { vocabularyKeys } from '@/features/vocabulary/hooks/queryKeys';
import {
  runCompleteVocabularyAttempt,
  vocabularyCompletionMutationKey,
  type VocabularyCompletionMutationInput,
} from '@/features/vocabulary/mutations';
import {
  getSituation,
  getSituationExercises,
  getSituations,
  getWeakProgress,
} from '@/features/vocabulary/services';
import { usePracticeSession } from '@/features/vocabulary/session';
import { loadCompletedSession } from '@/features/vocabulary/session/completedSessionCache';

const CONTENT_STALE_MS = 5 * 60 * 1000;

export function useVocabularySituations() {
  return useQuery({
    queryKey: vocabularyKeys.situations(),
    queryFn: getSituations,
    staleTime: CONTENT_STALE_MS,
  });
}

export function useVocabularySituation(situationId: string | undefined) {
  return useQuery({
    queryKey: vocabularyKeys.situation(situationId ?? ''),
    enabled: Boolean(situationId),
    queryFn: () => getSituation(situationId as string),
    staleTime: CONTENT_STALE_MS,
  });
}

export function useVocabularyExercises(situationId: string | undefined) {
  return useQuery({
    queryKey: vocabularyKeys.exercises(situationId ?? ''),
    enabled: Boolean(situationId),
    queryFn: () => getSituationExercises(situationId as string),
    staleTime: CONTENT_STALE_MS,
  });
}

export function useVocabularyWeakProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: vocabularyKeys.weak(user?.id ?? ''),
    enabled: Boolean(user?.id),
    queryFn: () => getWeakProgress(user!.id),
  });
}

export function useVocabularyResultSession(clientAttemptId: string | undefined) {
  const { getCompletedSession } = usePracticeSession();
  const inMemory = clientAttemptId ? getCompletedSession(clientAttemptId) : null;

  const cacheQuery = useQuery({
    queryKey: vocabularyKeys.completedSession(clientAttemptId ?? ''),
    queryFn: () => loadCompletedSession(clientAttemptId as string),
    enabled: Boolean(clientAttemptId) && !inMemory,
    staleTime: Infinity,
  });

  const session = inMemory ?? cacheQuery.data ?? null;
  const isLoading = !inMemory && Boolean(clientAttemptId) && cacheQuery.isLoading;

  return { session, isLoading };
}

export function useCompleteVocabularyAttempt() {
  return useMutation({
    mutationKey: vocabularyCompletionMutationKey,
    mutationFn: runCompleteVocabularyAttempt,
    networkMode: 'online',
  });
}

export type { VocabularyCompletionMutationInput };
