jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

jest.mock('@/core/analytics/scoreBucket', () => ({
  scoreBucket: jest.fn(() => '80-89'),
}));

jest.mock('@/core/monitoring/crashlytics', () => ({
  recordError: jest.fn(async () => undefined),
}));

jest.mock('@/features/grammar/services', () => ({
  completeGrammarAttempt: jest.fn(async () => undefined),
}));

import { QueryClient } from '@tanstack/react-query';

import {
  configureGrammarMutationDefaults,
  grammarCompletionMutationKey,
  runCompleteGrammarAttempt,
} from '@/features/grammar/mutations';
import { GrammarDomainError } from '@/features/grammar/services/errors';

const { completeGrammarAttempt } = jest.requireMock('@/features/grammar/services') as {
  completeGrammarAttempt: jest.Mock;
};
const { trackEvent } = jest.requireMock('@/core/analytics/events') as { trackEvent: jest.Mock };
const { recordError } = jest.requireMock('@/core/monitoring/crashlytics') as {
  recordError: jest.Mock;
};

const baseInput = {
  userId: 'user-1',
  clientAttemptId: 'a1',
  topicId: 't1',
  lessonId: 'l1',
  contentRevision: 1,
  correctCount: 7,
  totalCount: 10,
  score: 85,
  answers: [],
  startedAt: 'x',
  completedAt: 'y',
  topicSlug: 'present-simple',
  lessonSlug: 'present-simple-a2',
};

describe('grammar mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes the attempt and returns the user id', async () => {
    await expect(runCompleteGrammarAttempt(baseInput)).resolves.toBe('user-1');
    expect(completeGrammarAttempt).toHaveBeenCalledWith('user-1', baseInput);
  });

  it('configures retry, success (>=70 and <70), and error handlers', async () => {
    const client = new QueryClient();
    const invalidateQueries = jest.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    configureGrammarMutationDefaults(client);

    const defaults = client.getMutationDefaults(grammarCompletionMutationKey);
    expect(defaults.mutationFn).toBe(runCompleteGrammarAttempt);

    const retry = defaults.retry as (count: number, error: unknown) => boolean;
    expect(retry(0, new GrammarDomainError('unauthorized', 'nope'))).toBe(false);
    expect(retry(1, new Error('x'))).toBe(true);
    expect(retry(3, new Error('x'))).toBe(false);

    await defaults.onSuccess?.(
      'user-1',
      baseInput as never,
      undefined as never,
      undefined as never,
    );
    expect(trackEvent).toHaveBeenCalledWith(
      'grammar_practice_completed',
      expect.objectContaining({ topic_slug: 'present-simple' }),
    );
    expect(trackEvent).toHaveBeenCalledWith(
      'grammar_lesson_completed',
      expect.objectContaining({ lesson_slug: 'present-simple-a2' }),
    );
    expect(invalidateQueries).toHaveBeenCalled();

    trackEvent.mockClear();
    await defaults.onSuccess?.(
      'user-1',
      { ...baseInput, score: 60 } as never,
      undefined as never,
      undefined as never,
    );
    expect(trackEvent).toHaveBeenCalledWith('grammar_practice_completed', expect.anything());
    expect(trackEvent).not.toHaveBeenCalledWith('grammar_lesson_completed', expect.anything());

    recordError.mockRejectedValueOnce(undefined);
    defaults.onError?.(new Error('fail'), {} as never, undefined as never, undefined as never);
    expect(recordError).toHaveBeenCalled();
  });
});
