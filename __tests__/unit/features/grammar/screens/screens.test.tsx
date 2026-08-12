import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { GrammarHomeScreen } from '@/features/grammar/screens/GrammarHomeScreen';
import { GrammarLessonScreen } from '@/features/grammar/screens/GrammarLessonScreen';
import { GrammarPracticeScreen } from '@/features/grammar/screens/GrammarPracticeScreen';
import { GrammarResultScreen } from '@/features/grammar/screens/GrammarResultScreen';
import { GrammarTopicScreen } from '@/features/grammar/screens/GrammarTopicScreen';
import { GrammarDomainError } from '@/features/grammar/services';

import { FIXTURE_MC } from '../../../../helpers/grammarFixtures';

function textOf(node: { props: { children?: unknown } }): string {
  const value = node.props.children;
  if (Array.isArray(value)) {
    return value.map((item) => (item == null ? '' : String(item))).join('');
  }
  return value == null ? '' : String(value);
}

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();
const mockDispatch = jest.fn();
const mockAddListener = jest.fn(() => () => undefined);

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual(
    '@react-navigation/native',
  ) as typeof import('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      replace: mockReplace,
      dispatch: mockDispatch,
      addListener: mockAddListener,
      getParent: () => ({
        getState: () => ({
          routes: [
            { name: 'GrammarHome' },
            { name: 'GrammarTopic', params: { topicId: 'topic-1' } },
            { name: 'GrammarLesson', params: { topicId: 'topic-1', lessonId: 'lesson-1' } },
            { name: 'GrammarPracticeFlow' },
          ],
        }),
        dispatch: mockDispatch,
      }),
    }),
    useRoute: () => ({
      params: {
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        clientAttemptId: 'attempt-1',
      },
    }),
  };
});

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(() => ({ data: { grammar: true, vocabulary: false } })),
}));

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual(
    '@tanstack/react-query',
  ) as typeof import('@tanstack/react-query');
  return {
    ...actual,
    useMutationState: jest.fn(() => []),
  };
});

jest.mock('@/features/grammar/hooks', () => {
  const actual = jest.requireActual(
    '@/features/grammar/hooks',
  ) as typeof import('@/features/grammar/hooks');
  return {
    ...actual,
    useGrammarTopics: jest.fn(),
    useGrammarProgress: jest.fn(() => ({ data: [], refetch: jest.fn() })),
    useGrammarContinueLearning: jest.fn(() => ({
      target: null,
      topicTitle: undefined,
      lessonTitle: undefined,
      isLoading: false,
      isReady: true,
    })),
    useGrammarResultSession: jest.fn(() => ({ session: null, isLoading: false })),
    useGrammarTopic: jest.fn(() => ({ data: undefined })),
    useGrammarLessons: jest.fn(),
    useGrammarLesson: jest.fn(),
    useGrammarExercises: jest.fn(),
    useCompleteGrammarAttempt: jest.fn(() => ({
      mutate: jest.fn(),
      isPending: false,
      isPaused: false,
    })),
  };
});

jest.mock('@/features/grammar/session', () => {
  const actual = jest.requireActual(
    '@/features/grammar/session',
  ) as typeof import('@/features/grammar/session');
  return {
    ...actual,
    usePracticeSession: jest.fn(),
  };
});

const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
  useFeatureFlags: jest.Mock;
};
const hooks = jest.requireMock('@/features/grammar/hooks') as {
  useGrammarTopics: jest.Mock;
  useGrammarProgress: jest.Mock;
  useGrammarContinueLearning: jest.Mock;
  useGrammarResultSession: jest.Mock;
  useGrammarTopic: jest.Mock;
  useGrammarLessons: jest.Mock;
  useGrammarLesson: jest.Mock;
  useGrammarExercises: jest.Mock;
};
const session = jest.requireMock('@/features/grammar/session') as {
  usePracticeSession: jest.Mock;
};

describe('grammar browse screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFeatureFlags.mockReturnValue({ data: { grammar: true, vocabulary: false } });
    hooks.useGrammarProgress.mockReturnValue({ data: [], refetch: jest.fn() });
    hooks.useGrammarLessons.mockReturnValue({ data: [] });
    hooks.useGrammarContinueLearning.mockReturnValue({
      target: null,
      topicTitle: undefined,
      lessonTitle: undefined,
      isLoading: false,
      isReady: true,
    });
  });

  it('lists topics on Grammar Home', async () => {
    hooks.useGrammarTopics.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'topic-1',
          slug: 'present-simple',
          title: 'Present Simple',
          description: 'Habits',
          sortOrder: 1,
          lessonCount: 4,
        },
      ],
      refetch: jest.fn(),
    });
    hooks.useGrammarContinueLearning.mockReturnValue({
      target: { topicId: 'topic-1', lessonId: 'lesson-1' },
      topicTitle: 'Present Simple',
      lessonTitle: 'A2 · Habits',
      isLoading: false,
      isReady: true,
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarHomeScreen />);
    });
    expect(
      root.root.findAllByType(Text).some((node) => node.props.children === 'Present Simple'),
    ).toBe(true);
    expect(root.root.findByProps({ testID: 'grammar-home-continue' })).toBeTruthy();
  });

  it('shows home loading, empty, domain error, and retry', async () => {
    const refetchTopics = jest.fn(async () => undefined);
    const refetchProgress = jest.fn(async () => undefined);
    hooks.useGrammarProgress.mockReturnValue({ data: [], refetch: refetchProgress });

    hooks.useGrammarTopics.mockReturnValue({
      isLoading: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      refetch: refetchTopics,
    });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarHomeScreen />);
    });
    expect(root.root.findByProps({ testID: 'grammar-home-loading' })).toBeTruthy();

    hooks.useGrammarTopics.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [],
      refetch: refetchTopics,
    });
    await act(() => {
      root.update(<GrammarHomeScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('No published topics')),
    ).toBe(true);

    hooks.useGrammarTopics.mockReturnValue({
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: new GrammarDomainError('unavailable', 'Offline'),
      data: undefined,
      refetch: refetchTopics,
    });
    await act(() => {
      root.update(<GrammarHomeScreen />);
    });
    expect(root.root.findAllByType(Text).some((node) => node.props.children === 'Offline')).toBe(
      true,
    );
    const retry = root.root.findByProps({ testID: 'grammar-home-retry' });
    await act(() => {
      retry.props.onPress();
    });
    expect(refetchTopics).toHaveBeenCalled();
    expect(refetchProgress).toHaveBeenCalled();

    hooks.useGrammarTopics.mockReturnValue({
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: new Error('network'),
      data: undefined,
      refetch: refetchTopics,
    });
    await act(() => {
      root.update(<GrammarHomeScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Couldn’t load topics')),
    ).toBe(true);
  });

  it('redirects home when grammar flag is off', async () => {
    useFeatureFlags.mockReturnValue({ data: { grammar: false } });
    hooks.useGrammarTopics.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: jest.fn(),
    });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarHomeScreen />);
    });
    expect(root.toJSON()).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('renders topic lessons, statuses, retry, and navigates to lesson', async () => {
    const refetch = jest.fn(async () => undefined);
    hooks.useGrammarTopic.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: 'topic-1',
        slug: 'present-simple',
        title: 'Present Simple',
        description: 'Habits at work',
        sortOrder: 1,
      },
      refetch,
      error: null,
    });
    hooks.useGrammarLessons.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'lesson-1',
          slug: 'present-simple-core',
          title: 'A2 · Form',
          description: 'Use Present Simple for routines.',
          level: 'A2',
          topicId: 'topic-1',
        },
      ],
      refetch,
    });
    hooks.useGrammarProgress.mockReturnValue({
      data: [
        {
          lessonId: 'lesson-1',
          topicId: 'topic-1',
          status: 'in_progress',
          bestScore: 60,
        },
      ],
      refetch,
    });

    let topic!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      topic = ReactTestRenderer.create(<GrammarTopicScreen />);
    });
    expect(
      topic.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Habits at work')),
    ).toBe(true);
    expect(topic.root.findByProps({ testID: 'grammar-topic-continue' }).props.label).toBe(
      'Continue',
    );

    const row = topic.root.findByProps({ testID: 'grammar-lesson-row-present-simple-core' });
    await act(() => {
      row.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarLesson', {
      topicId: 'topic-1',
      lessonId: 'lesson-1',
    });

    hooks.useGrammarTopic.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: 'topic-1',
        slug: 'present-simple',
        title: 'Present Simple',
        description: '',
        sortOrder: 1,
      },
      refetch,
      error: null,
    });
    hooks.useGrammarLessons.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'lesson-1',
          slug: 'form',
          title: 'A2 · Form',
          description: 'Short lesson description.',
          level: 'A2',
          topicId: 'topic-1',
        },
        {
          id: 'lesson-2',
          slug: 'usage',
          title: 'A2 · Usage',
          description: 'Short lesson description.',
          level: 'A2',
          topicId: 'topic-1',
        },
        {
          id: 'lesson-3',
          slug: 'practice',
          title: 'A2 · Practice',
          description: 'Short lesson description.',
          level: 'A2',
          topicId: 'topic-1',
        },
      ],
      refetch,
    });
    hooks.useGrammarProgress.mockReturnValue({
      data: [{ lessonId: 'lesson-1', topicId: 'topic-1', status: 'completed', bestScore: 90 }],
      refetch,
    });
    await act(() => {
      topic.update(<GrammarTopicScreen />);
    });
    expect(
      topic.root
        .findAllByType(Text)
        .some((node) =>
          String(node.props.children).includes('Learn form, usage, and practical expressions'),
        ),
    ).toBe(true);
    expect(topic.root.findByProps({ testID: 'grammar-topic-continue' }).props.label).toBe(
      'Continue',
    );
    expect(topic.root.findByProps({ testID: 'grammar-lesson-row-practice' })).toBeTruthy();
    await act(() => {
      topic.root.findByProps({ testID: 'grammar-topic-continue' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarLesson', {
      topicId: 'topic-1',
      lessonId: 'lesson-2',
    });

    hooks.useGrammarTopic.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      error: new GrammarDomainError('not_found', 'Missing topic'),
      refetch,
    });
    hooks.useGrammarLessons.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch,
    });
    await act(() => {
      topic.update(<GrammarTopicScreen />);
    });
    expect(
      topic.root.findAllByType(Text).some((node) => node.props.children === 'Missing topic'),
    ).toBe(true);
    const retryLabel = topic.root
      .findAllByType(Text)
      .find((node) => node.props.children === 'Retry');
    expect(retryLabel).toBeTruthy();

    hooks.useGrammarTopic.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: 'topic-1',
        slug: 'present-simple',
        title: 'Present Simple',
        description: 'Habits at work',
        sortOrder: 1,
      },
      refetch,
      error: null,
    });
    hooks.useGrammarLessons.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'lesson-1',
          slug: 'present-simple-core',
          title: 'A2 · Form',
          description: 'Use Present Simple for routines.',
          level: 'A2',
          topicId: 'topic-1',
        },
      ],
      refetch,
    });
    hooks.useGrammarProgress.mockReturnValue({
      data: [
        {
          lessonId: 'lesson-1',
          topicId: 'topic-1',
          status: 'completed',
          bestScore: 90,
        },
      ],
      refetch,
    });
    await act(() => {
      topic.update(<GrammarTopicScreen />);
    });
    expect(topic.root.findByProps({ testID: 'grammar-topic-continue' }).props.label).toBe('Start');
    expect(
      topic.root.findAllByType(Text).some((node) => String(node.props.children).includes('90%')),
    ).toBe(true);

    hooks.useGrammarLessons.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [],
      refetch,
    });
    await act(() => {
      topic.update(<GrammarTopicScreen />);
    });
    expect(
      topic.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('No published lessons')),
    ).toBe(true);
  });

  it('renders compact theory and starts practice on every lesson', async () => {
    const content = {
      usage: 'Habits and facts.',
      forms: {
        affirmative: 'S + V',
        negative: 'S + do not + V',
        question: 'Do + S + V?',
      },
      examples: [{ id: 'e1', context: 'Standup', sentence: 'I update the board.' }],
      tips: ['Use does with he/she/it.'],
    };
    hooks.useGrammarLessons.mockReturnValue({
      data: [
        { id: 'lesson-1', slug: 'present-simple-a2', sortOrder: 1 },
        { id: 'lesson-2', slug: 'present-simple-b1', sortOrder: 2 },
      ],
    });
    hooks.useGrammarLesson.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: 'lesson-1',
        slug: 'present-simple-a2',
        title: 'A2 · Habits',
        description: 'Habits and facts. Cue: every / usually / still.',
        level: 'A2',
        sortOrder: 1,
        content,
      },
    });

    let lesson!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      lesson = ReactTestRenderer.create(<GrammarLessonScreen />);
    });
    expect(
      lesson.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Examples')),
    ).toBe(true);
    expect(
      lesson.root.findAllByType(Text).some((node) => String(node.props.children).includes("Don't")),
    ).toBe(true);
    expect(
      lesson.root.findAllByType(Text).some((node) => String(node.props.children).includes('When')),
    ).toBe(true);
    const practiceCta = lesson.root.findByProps({ testID: 'grammar-practice-cta' });
    await act(() => {
      practiceCta.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarPracticeFlow', {
      screen: 'GrammarPractice',
      params: {
        topicId: 'topic-1',
        lessonId: 'lesson-1',
      },
    });
  });

  it('renders lesson loading and generic error', async () => {
    hooks.useGrammarLesson.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarLessonScreen />);
    });

    hooks.useGrammarLesson.mockReturnValue({
      isLoading: false,
      isError: true,
      error: new Error('boom'),
      data: undefined,
    });
    await act(() => {
      root.update(<GrammarLessonScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Couldn’t load this lesson')),
    ).toBe(true);

    hooks.useGrammarLesson.mockReturnValue({
      isLoading: false,
      isError: true,
      error: new GrammarDomainError('not_found', 'Lesson gone'),
      data: undefined,
    });
    await act(() => {
      root.update(<GrammarLessonScreen />);
    });
    expect(
      root.root.findAllByType(Text).some((node) => node.props.children === 'Lesson gone'),
    ).toBe(true);
  });
});

describe('grammar practice/result screens', () => {
  const mc = FIXTURE_MC;

  beforeEach(() => {
    jest.clearAllMocks();
    hooks.useGrammarTopic.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: {
        id: 'topic-1',
        slug: 'present-simple',
        title: 'Present Simple',
        description: 'x',
        sortOrder: 1,
      },
      refetch: jest.fn(),
    });
    hooks.useGrammarLesson.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: 'lesson-1',
        slug: 'core',
        title: 'A2 · Form',
        description: 'Use Present Simple for habits.',
        level: 'A2',
        contentRevision: 1,
        content: {
          usage: 'u',
          forms: { affirmative: 'a', negative: 'n', question: 'q' },
          examples: [],
          tips: [],
        },
      },
      refetch: jest.fn(),
    });
  });

  it('loads practice, checks answer, and can show empty set', async () => {
    const startSession = jest.fn();
    const dispatch = jest.fn();
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc],
        index: 0,
        phase: 'answering',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'attempt-1',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: '2026-01-01',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch,
      applyAction: jest.fn((action: { type: string }) => {
        dispatch(action as never);
        return { phase: 'reviewing' } as never;
      }),
      startSession,
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    hooks.useGrammarExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: mc.id,
          exerciseKey: mc.id,
          topicId: 'topic-1',
          lessonId: 'lesson-1',
          type: mc.type,
          prompt: mc.prompt,
          explanation: mc.explanation,
          sortOrder: mc.sortOrder,
          contentSchemaVersion: 1,
          payload: mc.payload,
          answer: mc.answer,
        },
      ],
      refetch: jest.fn(),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarPracticeScreen />);
    });
    expect(startSession).toHaveBeenCalled();
    expect(root.root.findByProps({ testID: 'grammar-practice-progress' })).toBeTruthy();
    expect(root.root.findAllByType(Text).some((node) => textOf(node).includes('1 / 1'))).toBe(true);

    hooks.useGrammarExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [],
      refetch: jest.fn(),
    });
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [],
        index: 0,
        phase: 'answering',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: '',
        topicId: '',
        lessonId: '',
        contentRevision: 1,
        startedAt: '',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch,
      applyAction: jest.fn((action: { type: string }) => {
        dispatch(action as never);
        return { phase: 'reviewing' } as never;
      }),
      startSession,
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('no published exercises')),
    ).toBe(true);
  });

  it('shows practice error retry and result missing/found sessions', async () => {
    const refetch = jest.fn(async () => undefined);
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [],
        index: 0,
        phase: 'answering',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: '',
        topicId: '',
        lessonId: '',
        contentRevision: 1,
        startedAt: '',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch: jest.fn(),
      applyAction: jest.fn((_action) => ({ phase: 'reviewing' })),
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(() => null),
    });
    hooks.useGrammarExercises.mockReturnValue({
      isLoading: false,
      isError: true,
      error: new GrammarDomainError('unavailable', 'Down'),
      data: undefined,
      refetch,
    });
    hooks.useGrammarTopic.mockReturnValue({
      isLoading: false,
      isError: true,
      refetch,
    });
    hooks.useGrammarLesson.mockReturnValue({
      isLoading: false,
      isError: true,
      refetch,
    });

    let practice!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      practice = ReactTestRenderer.create(<GrammarPracticeScreen />);
    });
    const retry = practice.root.findByProps({ testID: 'grammar-practice-retry' });
    await act(() => {
      retry.props.onPress();
    });
    expect(refetch).toHaveBeenCalled();

    let missing!: ReactTestRenderer.ReactTestRenderer;
    hooks.useGrammarResultSession.mockReturnValue({ session: null, isLoading: false });
    await act(() => {
      missing = ReactTestRenderer.create(<GrammarResultScreen />);
    });
    expect(
      missing.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('isn’t available')),
    ).toBe(true);

    hooks.useGrammarResultSession.mockReturnValue({
      session: {
        clientAttemptId: 'attempt-1',
        topicId: 't',
        lessonId: 'l',
        contentRevision: 1,
        correctCount: 0,
        totalCount: 1,
        score: 50,
        completed: false,
        answers: [],
        startedAt: 'x',
        completedAt: 'y',
      },
      isLoading: false,
    });
    let found!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      found = ReactTestRenderer.create(<GrammarResultScreen />);
    });
    expect(found.root.findAllByType(Text).some((node) => textOf(node).includes('50%'))).toBe(true);
    expect(
      found.root.findAllByType(Text).some((node) => textOf(node).includes('Keep practicing')),
    ).toBe(true);
    expect(
      found.root.findAllByType(Text).some((node) => textOf(node).includes('Your result')),
    ).toBe(true);

    const clearActiveSession = jest.fn();
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [],
        index: 0,
        phase: 'completed',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 8,
        clientAttemptId: 'attempt-pass',
        topicId: 't',
        lessonId: 'l',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: 'y',
        score: 80,
        completed: true,
      },
      dispatch: jest.fn(),
      applyAction: jest.fn((_action) => ({ phase: 'reviewing' })),
      startSession: jest.fn(),
      clearActiveSession,
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    hooks.useGrammarResultSession.mockReturnValue({
      session: {
        clientAttemptId: 'attempt-pass',
        topicId: 't',
        lessonId: 'l',
        contentRevision: 1,
        correctCount: 8,
        totalCount: 10,
        score: 80,
        completed: true,
        answers: [],
        startedAt: 'x',
        completedAt: 'y',
      },
      isLoading: false,
    });
    hooks.useGrammarTopic.mockReturnValue({
      data: { id: 't', slug: 'past-simple', title: 'Past Simple' },
    });
    let passed!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      passed = ReactTestRenderer.create(<GrammarResultScreen />);
    });
    expect(
      passed.root.findAllByType(Text).some((node) => textOf(node).includes('Lesson complete')),
    ).toBe(true);
    expect(
      passed.root.findAllByType(Text).some((node) => textOf(node).includes('Progress saved')),
    ).toBe(true);
    expect(
      passed.root.findAllByType(Text).some((node) => textOf(node).includes('This attempt: 80%')),
    ).toBe(true);
    await act(() => {
      passed.root.findByProps({ testID: 'grammar-result-home' }).props.onPress();
    });
    expect(clearActiveSession).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RESET',
        payload: expect.objectContaining({
          routes: expect.arrayContaining([
            expect.objectContaining({
              name: 'GrammarTopic',
              params: { topicId: 't' },
            }),
          ]),
        }),
      }),
    );

    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [],
        index: 0,
        phase: 'completed',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 10,
        clientAttemptId: 'attempt-perfect',
        topicId: 't',
        lessonId: 'l',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: 'y',
        score: 100,
        completed: true,
      },
      dispatch: jest.fn(),
      applyAction: jest.fn((_action) => ({ phase: 'reviewing' })),
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    hooks.useGrammarResultSession.mockReturnValue({
      session: {
        clientAttemptId: 'attempt-perfect',
        topicId: 't',
        lessonId: 'l',
        contentRevision: 1,
        correctCount: 10,
        totalCount: 10,
        score: 100,
        completed: true,
        answers: [],
        startedAt: 'x',
        completedAt: 'y',
      },
      isLoading: false,
    });
    let perfect!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      perfect = ReactTestRenderer.create(<GrammarResultScreen />);
    });
    expect(
      perfect.root
        .findAllByType(Text)
        .some((node) => textOf(node).includes('Great accuracy on this set')),
    ).toBe(true);
    expect(
      perfect.root
        .findAllByType(Text)
        .some((node) => textOf(node).includes('Return to this topic anytime')),
    ).toBe(true);
  });
});
