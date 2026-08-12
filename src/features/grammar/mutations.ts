import { trackEvent } from '@/core/analytics/events';
import { scoreBucket } from '@/core/analytics/scoreBucket';
import { recordError } from '@/core/monitoring/crashlytics';
import { grammarKeys } from '@/features/grammar/hooks/queryKeys';
import {
  completeGrammarAttempt,
  type CompleteGrammarAttemptInput,
} from '@/features/grammar/services';
import { GrammarDomainError } from '@/features/grammar/services/errors';

import type { QueryClient } from '@tanstack/react-query';

export const grammarCompletionMutationKey = ['grammar-complete-attempt'] as const;

export type GrammarCompletionMutationInput = CompleteGrammarAttemptInput & {
  userId: string;
  topicSlug?: string;
  lessonSlug?: string;
};

export async function runCompleteGrammarAttempt(
  input: GrammarCompletionMutationInput,
): Promise<string> {
  await completeGrammarAttempt(input.userId, input);
  return input.userId;
}

export function configureGrammarMutationDefaults(client: QueryClient) {
  client.setMutationDefaults(grammarCompletionMutationKey, {
    mutationFn: runCompleteGrammarAttempt,
    networkMode: 'online',
    retry: (failureCount, error) => {
      if (error instanceof GrammarDomainError && error.code === 'unauthorized') {
        return false;
      }
      return failureCount < 3;
    },
    onSuccess: async (_userId, input) => {
      const bucket = scoreBucket(input.score);
      await trackEvent('grammar_practice_completed', {
        topic_slug: input.topicSlug,
        lesson_slug: input.lessonSlug,
        score_bucket: bucket,
      });
      if (input.score >= 70) {
        await trackEvent('grammar_lesson_completed', {
          topic_slug: input.topicSlug,
          lesson_slug: input.lessonSlug,
          score_bucket: bucket,
        });
      }
      await client.invalidateQueries({ queryKey: grammarKeys.progress(input.userId) });
      await client.invalidateQueries({
        queryKey: grammarKeys.attempt(input.userId, input.clientAttemptId),
      });
    },
    onError: (error) => {
      recordError(error).catch(() => undefined);
    },
  });
}
