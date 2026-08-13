import { trackEvent } from '@/core/analytics/events';
import { scoreBucket } from '@/core/analytics/scoreBucket';
import { recordError } from '@/core/monitoring/crashlytics';
import { markItemsKnown } from '@/features/vocabulary/data/knownItemsStore';
import { vocabularyKeys } from '@/features/vocabulary/hooks/queryKeys';
import {
  completeVocabularyAttempt,
  type CompleteVocabularyAttemptInput,
} from '@/features/vocabulary/services';
import { VocabularyDomainError } from '@/features/vocabulary/services/errors';

import type { QueryClient } from '@tanstack/react-query';

export const vocabularyCompletionMutationKey = ['vocabulary-complete-attempt'] as const;

export type VocabularyCompletionMutationInput = CompleteVocabularyAttemptInput & {
  userId: string;
  situationSlug?: string;
};

export async function runCompleteVocabularyAttempt(
  input: VocabularyCompletionMutationInput,
): Promise<string> {
  await completeVocabularyAttempt(input.userId, input);
  const knownIds = input.itemResults.filter((row) => row.correct).map((row) => row.itemId);
  if (knownIds.length > 0) {
    await markItemsKnown(knownIds);
  }
  return input.userId;
}

export function configureVocabularyMutationDefaults(client: QueryClient) {
  client.setMutationDefaults(vocabularyCompletionMutationKey, {
    mutationFn: runCompleteVocabularyAttempt,
    networkMode: 'online',
    retry: (failureCount, error) => {
      if (error instanceof VocabularyDomainError && error.code === 'unauthorized') {
        return false;
      }
      return failureCount < 3;
    },
    onSuccess: async (_userId, input) => {
      const bucket = scoreBucket(input.score);
      await trackEvent('vocabulary_practice_completed', {
        situation_slug: input.situationSlug,
        score_bucket: bucket,
      });
      await client.invalidateQueries({ queryKey: vocabularyKeys.weak(input.userId) });
      await client.invalidateQueries({
        queryKey: vocabularyKeys.attempt(input.userId, input.clientAttemptId),
      });
    },
    onError: (error) => {
      recordError(error).catch(() => undefined);
    },
  });
}
