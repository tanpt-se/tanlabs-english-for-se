jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

jest.mock('@/core/analytics/scoreBucket', () => ({
  scoreBucket: jest.fn(() => '80-89'),
}));

jest.mock('@/core/monitoring/crashlytics', () => ({
  recordError: jest.fn(async () => undefined),
}));

jest.mock('@/features/vocabulary/data/knownItemsStore', () => ({
  markItemsKnown: jest.fn(async () => undefined),
}));

jest.mock('@/features/vocabulary/services', () => ({
  completeVocabularyAttempt: jest.fn(async () => undefined),
}));

import { QueryClient } from '@tanstack/react-query';

import {
  configureVocabularyMutationDefaults,
  runCompleteVocabularyAttempt,
  vocabularyCompletionMutationKey,
} from '@/features/vocabulary/mutations';
import { VocabularyDomainError } from '@/features/vocabulary/services/errors';

const { completeVocabularyAttempt } = jest.requireMock('@/features/vocabulary/services') as {
  completeVocabularyAttempt: jest.Mock;
};
const { markItemsKnown } = jest.requireMock('@/features/vocabulary/data/knownItemsStore') as {
  markItemsKnown: jest.Mock;
};
const { trackEvent } = jest.requireMock('@/core/analytics/events') as { trackEvent: jest.Mock };
const { recordError } = jest.requireMock('@/core/monitoring/crashlytics') as {
  recordError: jest.Mock;
};

describe('vocabulary mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes attempt and marks known items', async () => {
    await runCompleteVocabularyAttempt({
      userId: 'user-1',
      clientAttemptId: 'a1',
      situationId: 's1',
      contentRevision: 1,
      correctCount: 1,
      totalCount: 1,
      score: 100,
      itemResults: [
        { itemId: 's1:a', correct: true },
        { itemId: 's1:b', correct: false },
      ],
      startedAt: 'x',
      completedAt: 'y',
      situationSlug: 'task-progress',
    });
    expect(completeVocabularyAttempt).toHaveBeenCalled();
    expect(markItemsKnown).toHaveBeenCalledWith(['s1:a']);
  });

  it('configures mutation defaults with retry and side effects', async () => {
    const client = new QueryClient();
    const invalidateQueries = jest.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    configureVocabularyMutationDefaults(client);

    const defaults = client.getMutationDefaults(vocabularyCompletionMutationKey);
    expect(defaults.mutationFn).toBe(runCompleteVocabularyAttempt);

    const retry = defaults.retry as (count: number, error: unknown) => boolean;
    expect(retry(0, new VocabularyDomainError('unauthorized', 'nope'))).toBe(false);
    expect(retry(1, new Error('x'))).toBe(true);
    expect(retry(3, new Error('x'))).toBe(false);

    await defaults.onSuccess?.(
      'user-1',
      {
        userId: 'user-1',
        clientAttemptId: 'a1',
        situationId: 's1',
        contentRevision: 1,
        correctCount: 1,
        totalCount: 1,
        score: 85,
        itemResults: [],
        startedAt: 'x',
        completedAt: 'y',
        situationSlug: 'task-progress',
      } as never,
      undefined as never,
      undefined as never,
    );
    expect(trackEvent).toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalled();

    defaults.onError?.(new Error('fail'), {} as never, undefined as never, undefined as never);
    expect(recordError).toHaveBeenCalled();
  });
});
