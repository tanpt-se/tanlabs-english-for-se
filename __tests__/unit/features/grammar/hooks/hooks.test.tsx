import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  useCompleteGrammarAttempt,
  useGrammarContinueLearning,
  useGrammarExercises,
  useGrammarLesson,
  useGrammarLessonProgress,
  useGrammarLessons,
  useGrammarProgress,
  useGrammarResultSession,
  useGrammarTopic,
  useGrammarTopics,
} from '@/features/grammar/hooks';
import { grammarKeys } from '@/features/grammar/hooks/queryKeys';
import { configureGrammarMutationDefaults } from '@/features/grammar/mutations';

jest.mock('@/core/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
    },
  },
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

jest.mock('@/core/monitoring/crashlytics', () => ({
  recordError: jest.fn(async () => undefined),
}));

jest.mock('@/features/grammar/session', () => ({
  usePracticeSession: jest.fn(() => ({ getCompletedSession: jest.fn(() => null) })),
}));

jest.mock('@/features/grammar/session/completedSessionCache', () => ({
  loadCompletedSession: jest.fn(async () => null),
}));

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

jest.mock('@/features/grammar/services', () => ({
  getTopics: jest.fn(async () => [
    { id: 't1', slug: 'present-simple', title: 'Present Simple', sortOrder: 1, lessonCount: 1 },
  ]),
  getTopic: jest.fn(async () => ({ id: 't1', slug: 'present-simple' })),
  getLessonsByTopic: jest.fn(async () => [{ id: 'l1' }]),
  getAllPublishedLessons: jest.fn(async () => [
    { id: 'l1', topicId: 't1', title: 'A2 · Habits', sortOrder: 1 },
  ]),
  getLesson: jest.fn(async () => ({ id: 'l1', title: 'A2 · Form', description: 'core' })),
  getExercisesByLesson: jest.fn(async () => [{ id: 'e1' }]),
  getProgressForUser: jest.fn(async () => [{ lessonId: 'l1', status: 'completed' }]),
  getLessonProgress: jest.fn(async () => ({ lessonId: 'l1', status: 'completed' })),
  getGrammarAttemptByClientId: jest.fn(async () => null),
  completeGrammarAttempt: jest.fn(async () => undefined),
}));

const services = jest.requireMock('@/features/grammar/services') as {
  getTopics: jest.Mock;
  getTopic: jest.Mock;
  getLessonsByTopic: jest.Mock;
  getAllPublishedLessons: jest.Mock;
  getLesson: jest.Mock;
  getExercisesByLesson: jest.Mock;
  getProgressForUser: jest.Mock;
  getLessonProgress: jest.Mock;
  getGrammarAttemptByClientId: jest.Mock;
  completeGrammarAttempt: jest.Mock;
};

const { usePracticeSession } = jest.requireMock('@/features/grammar/session') as {
  usePracticeSession: jest.Mock;
};

const { loadCompletedSession } = jest.requireMock(
  '@/features/grammar/session/completedSessionCache',
) as {
  loadCompletedSession: jest.Mock;
};

const { trackEvent } = jest.requireMock('@/core/analytics/events') as {
  trackEvent: jest.Mock;
};

const { useAuth } = jest.requireMock('@/core/auth/AuthProvider') as {
  useAuth: jest.Mock;
};

function createClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity, retry: false },
    },
  });
  configureGrammarMutationDefaults(client);
  return client;
}

async function waitFor(predicate: () => boolean, label: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (predicate()) {
      return;
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
  throw new Error(`Timed out waiting for ${label}`);
}

describe('grammar query hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('exposes stable query keys', () => {
    expect(grammarKeys.topics()).toEqual(['grammar', 'topics']);
    expect(grammarKeys.topic('t1')).toEqual(['grammar', 'topic', 't1']);
    expect(grammarKeys.lessons('t1')).toEqual(['grammar', 'lessons', 't1']);
    expect(grammarKeys.lesson('l1')).toEqual(['grammar', 'lesson', 'l1']);
    expect(grammarKeys.exercises('l1')).toEqual(['grammar', 'exercises', 'l1']);
    expect(grammarKeys.progress('u1')).toEqual(['grammar', 'progress', 'u1']);
    expect(grammarKeys.lessonProgress('u1', 'l1')).toEqual(['grammar', 'progress', 'u1', 'l1']);
    expect(grammarKeys.allLessons()).toEqual(['grammar', 'all-lessons']);
    expect(grammarKeys.attempt('u1', 'attempt-1')).toEqual([
      'grammar',
      'attempt',
      'u1',
      'attempt-1',
    ]);
    expect(grammarKeys.completedSession('attempt-1')).toEqual([
      'grammar',
      'completed-session',
      'attempt-1',
    ]);
  });

  it('fetches topics, topic, lessons, lesson, exercises, and progress', async () => {
    let topicsApi: ReturnType<typeof useGrammarTopics> | undefined;
    let topicApi: ReturnType<typeof useGrammarTopic> | undefined;
    let lessonsApi: ReturnType<typeof useGrammarLessons> | undefined;
    let lessonApi: ReturnType<typeof useGrammarLesson> | undefined;
    let exercisesApi: ReturnType<typeof useGrammarExercises> | undefined;
    let progressApi: ReturnType<typeof useGrammarProgress> | undefined;
    let lessonProgressApi: ReturnType<typeof useGrammarLessonProgress> | undefined;

    function Probe() {
      topicsApi = useGrammarTopics();
      topicApi = useGrammarTopic('t1');
      lessonsApi = useGrammarLessons('t1');
      lessonApi = useGrammarLesson('l1');
      exercisesApi = useGrammarExercises('l1');
      progressApi = useGrammarProgress();
      lessonProgressApi = useGrammarLessonProgress('l1');
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={createClient()}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    await waitFor(() => topicsApi?.isSuccess === true, 'topics');
    await waitFor(() => topicApi?.isSuccess === true, 'topic');
    await waitFor(() => lessonsApi?.isSuccess === true, 'lessons');
    await waitFor(() => lessonApi?.isSuccess === true, 'lesson');
    await waitFor(() => exercisesApi?.isSuccess === true, 'exercises');
    await waitFor(() => progressApi?.isSuccess === true, 'progress');
    await waitFor(() => lessonProgressApi?.isSuccess === true, 'lessonProgress');

    expect(services.getTopics).toHaveBeenCalled();
    expect(services.getTopic).toHaveBeenCalledWith('t1');
    expect(services.getLessonsByTopic).toHaveBeenCalledWith('t1');
    expect(services.getLesson).toHaveBeenCalledWith('l1');
    expect(services.getExercisesByLesson).toHaveBeenCalledWith('l1');
    expect(services.getProgressForUser).toHaveBeenCalledWith('user-1');
    expect(services.getLessonProgress).toHaveBeenCalledWith('user-1', 'l1');

    act(() => {
      root.unmount();
    });
  });

  it('stays idle when ids or user are missing', async () => {
    useAuth.mockReturnValue({ user: null });
    let topicApi: ReturnType<typeof useGrammarTopic> | undefined;
    let progressApi: ReturnType<typeof useGrammarProgress> | undefined;

    function Probe() {
      topicApi = useGrammarTopic(undefined);
      progressApi = useGrammarProgress();
      useGrammarLessons(undefined);
      useGrammarLesson(undefined);
      useGrammarExercises(undefined);
      useGrammarLessonProgress(undefined);
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={createClient()}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    expect(topicApi?.fetchStatus).toBe('idle');
    expect(progressApi?.fetchStatus).toBe('idle');
    expect(services.getTopic).not.toHaveBeenCalled();
    expect(services.getProgressForUser).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('resolves continue learning after topics and all-lessons load', async () => {
    services.getProgressForUser.mockResolvedValueOnce([
      {
        topicId: 't1',
        lessonId: 'l1',
        status: 'in_progress',
        lastActivityAt: '2026-08-12T00:00:00Z',
      },
    ]);

    let continueApi: ReturnType<typeof useGrammarContinueLearning> | undefined;

    function Probe() {
      continueApi = useGrammarContinueLearning();
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={createClient()}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    await waitFor(() => continueApi?.isReady === true, 'continue learning');
    expect(continueApi?.target).toEqual({ topicId: 't1', lessonId: 'l1' });
    expect(continueApi?.topicTitle).toBe('Present Simple');
    expect(continueApi?.lessonTitle).toBe('A2 · Habits');
    expect(services.getAllPublishedLessons).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('prefers in-memory result session over cache and server', async () => {
    const session = {
      clientAttemptId: 'attempt-1',
      topicId: 't1',
      lessonId: 'l1',
      contentRevision: 1,
      correctCount: 1,
      totalCount: 1,
      score: 100,
      answers: [],
      startedAt: '2026-08-12T00:00:00Z',
      completedAt: '2026-08-12T00:01:00Z',
    };
    usePracticeSession.mockReturnValue({
      getCompletedSession: jest.fn(() => session),
    });

    let resultApi: ReturnType<typeof useGrammarResultSession> | undefined;

    function Probe() {
      resultApi = useGrammarResultSession('attempt-1');
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={createClient()}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    expect(resultApi?.session).toBe(session);
    expect(resultApi?.isLoading).toBe(false);
    expect(loadCompletedSession).not.toHaveBeenCalled();
    expect(services.getGrammarAttemptByClientId).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('falls back to cache then server for result session', async () => {
    usePracticeSession.mockReturnValue({
      getCompletedSession: jest.fn(() => null),
    });
    loadCompletedSession.mockResolvedValueOnce({
      clientAttemptId: 'attempt-cache',
      topicId: 't1',
      lessonId: 'l1',
      contentRevision: 1,
      correctCount: 2,
      totalCount: 3,
      score: 67,
      answers: [],
      startedAt: '2026-08-12T00:00:00Z',
      completedAt: '2026-08-12T00:01:00Z',
    });

    let cacheApi: ReturnType<typeof useGrammarResultSession> | undefined;
    function CacheProbe() {
      cacheApi = useGrammarResultSession('attempt-cache');
      return null;
    }

    let cacheRoot!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      cacheRoot = ReactTestRenderer.create(
        <QueryClientProvider client={createClient()}>
          <CacheProbe />
        </QueryClientProvider>,
      );
    });

    await waitFor(() => cacheApi?.session?.clientAttemptId === 'attempt-cache', 'cached session');
    expect(cacheApi?.isLoading).toBe(false);
    act(() => {
      cacheRoot.unmount();
    });

    loadCompletedSession.mockResolvedValueOnce(null);
    services.getGrammarAttemptByClientId.mockResolvedValueOnce({
      clientAttemptId: 'attempt-server',
      topicId: 't1',
      lessonId: 'l1',
      contentRevision: 1,
      correctCount: 9,
      totalCount: 10,
      score: 90,
      completed: true,
      answers: [],
      startedAt: '2026-08-12T00:00:00Z',
      completedAt: '2026-08-12T00:01:00Z',
    });

    let serverApi: ReturnType<typeof useGrammarResultSession> | undefined;
    function ServerProbe() {
      serverApi = useGrammarResultSession('attempt-server');
      return null;
    }

    let serverRoot!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      serverRoot = ReactTestRenderer.create(
        <QueryClientProvider client={createClient()}>
          <ServerProbe />
        </QueryClientProvider>,
      );
    });

    await waitFor(() => serverApi?.session?.clientAttemptId === 'attempt-server', 'server session');
    expect(services.getGrammarAttemptByClientId).toHaveBeenCalledWith('user-1', 'attempt-server');
    act(() => {
      serverRoot.unmount();
    });
  });

  it('completes attempts, tracks analytics, and invalidates progress', async () => {
    const client = createClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    let mutate!: ReturnType<typeof useCompleteGrammarAttempt>['mutateAsync'];

    function Probe() {
      const mutation = useCompleteGrammarAttempt();
      mutate = mutation.mutateAsync;
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await mutate({
        userId: 'user-1',
        clientAttemptId: 'attempt-1',
        topicId: 't1',
        lessonId: 'l1',
        contentRevision: 1,
        correctCount: 7,
        totalCount: 10,
        score: 70,
        answers: [],
        startedAt: '2026-08-12T00:00:00Z',
        completedAt: '2026-08-12T00:01:00Z',
        topicSlug: 'present-simple',
        lessonSlug: 'core',
      });
    });

    expect(services.completeGrammarAttempt).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        clientAttemptId: 'attempt-1',
        score: 70,
      }),
    );
    expect(trackEvent).toHaveBeenCalledWith('grammar_practice_completed', {
      topic_slug: 'present-simple',
      lesson_slug: 'core',
      score_bucket: '70-84',
    });
    expect(trackEvent).toHaveBeenCalledWith('grammar_lesson_completed', {
      topic_slug: 'present-simple',
      lesson_slug: 'core',
      score_bucket: '70-84',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: grammarKeys.progress('user-1') });

    act(() => {
      root.unmount();
    });
  });

  it('rejects completion when service reports unauthorized', async () => {
    const { runCompleteGrammarAttempt } = jest.requireActual(
      '@/features/grammar/mutations',
    ) as typeof import('@/features/grammar/mutations');
    const { GrammarDomainError } = jest.requireActual(
      '@/features/grammar/services/errors',
    ) as typeof import('@/features/grammar/services/errors');
    services.completeGrammarAttempt.mockRejectedValueOnce(
      new GrammarDomainError('unauthorized', 'Sign in to save your progress.'),
    );

    await expect(
      runCompleteGrammarAttempt({
        userId: 'user-1',
        clientAttemptId: 'attempt-none',
        topicId: 't1',
        lessonId: 'l1',
        contentRevision: 1,
        correctCount: 1,
        totalCount: 2,
        score: 50,
        answers: [],
        startedAt: '2026-08-12T00:00:00Z',
        completedAt: '2026-08-12T00:01:00Z',
      }),
    ).rejects.toMatchObject({
      code: 'unauthorized',
      message: 'Sign in to save your progress.',
    });
  });
});
