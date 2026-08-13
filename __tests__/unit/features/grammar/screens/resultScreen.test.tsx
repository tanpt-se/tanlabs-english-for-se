import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { GrammarResultScreen } from '@/features/grammar/screens/GrammarResultScreen';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockExitFlow = jest.fn();
const mockClear = jest.fn();
const mockMutate = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual(
    '@react-navigation/native',
  ) as typeof import('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate, dispatch: mockDispatch }),
    useRoute: () => ({ params: { clientAttemptId: 'attempt-1' } }),
    CommonActions: {
      reset: (payload: unknown) => ({ type: 'RESET', payload }),
    },
  };
});

jest.mock('@/features/grammar/navigation/exitPracticeFlow', () => ({
  exitGrammarPracticeFlow: (...args: unknown[]) => mockExitFlow(...args),
}));

jest.mock('@/features/grammar/session', () => ({
  usePracticeSession: () => ({ clearActiveSession: mockClear }),
}));

jest.mock('@/features/grammar/hooks', () => ({
  useGrammarResultSession: jest.fn(),
  useGrammarTopic: jest.fn(),
  useGrammarLessons: jest.fn(),
  useCompleteGrammarAttempt: jest.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    isPaused: false,
  })),
}));

const hooks = jest.requireMock('@/features/grammar/hooks') as {
  useGrammarResultSession: jest.Mock;
  useGrammarTopic: jest.Mock;
  useGrammarLessons: jest.Mock;
};
const rq = jest.requireMock('@tanstack/react-query') as { useMutationState: jest.Mock };

describe('GrammarResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rq.useMutationState.mockReturnValue([]);
    hooks.useGrammarTopic.mockReturnValue({
      data: { title: 'Present Simple', slug: 'present-simple' },
    });
    hooks.useGrammarLessons.mockReturnValue({ data: [] });
  });

  it('shows loading then missing session copy', async () => {
    hooks.useGrammarResultSession.mockReturnValue({ session: null, isLoading: true });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarResultScreen />);
    });
    expect(root.root.findByProps({ testID: 'grammar-result-loading' })).toBeTruthy();

    hooks.useGrammarResultSession.mockReturnValue({ session: null, isLoading: false });
    await act(() => {
      root.update(<GrammarResultScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('isn’t available')),
    ).toBe(true);
  });

  it('exits to home when session has no topic', async () => {
    hooks.useGrammarResultSession.mockReturnValue({
      session: {
        clientAttemptId: 'attempt-1',
        topicId: undefined,
        lessonId: 'lesson-1',
        contentRevision: 1,
        correctCount: 7,
        totalCount: 10,
        score: 70,
        completed: true,
        answers: [],
        startedAt: 'x',
        completedAt: 'y',
      },
      isLoading: false,
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarResultScreen />);
    });

    await act(() => {
      root.root.findByProps({ title: 'Lesson result' }).props.onBackPress();
    });
    expect(mockExitFlow).toHaveBeenCalledWith(expect.anything(), { name: 'GrammarHome' });
  });

  it('retries current lesson when session exists', async () => {
    hooks.useGrammarResultSession.mockReturnValue({
      session: {
        clientAttemptId: 'attempt-1',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        correctCount: 4,
        totalCount: 10,
        score: 40,
        completed: false,
        answers: [],
        startedAt: 'x',
        completedAt: 'y',
      },
      isLoading: false,
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarResultScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-result-retry' }).props.onPress();
    });

    expect(mockClear).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RESET',
        payload: expect.objectContaining({
          index: 0,
          routes: [
            expect.objectContaining({
              name: 'GrammarPractice',
              params: { topicId: 'topic-1', lessonId: 'lesson-1' },
            }),
          ],
        }),
      }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('covers save states, next lesson, retry save, and completed messaging', async () => {
    hooks.useGrammarTopic.mockReturnValue({
      data: { title: 'Present Simple', slug: 'present-simple' },
    });
    hooks.useGrammarLessons.mockReturnValue({
      data: [
        { id: 'lesson-1', slug: 'a2', title: 'A2' },
        { id: 'lesson-2', slug: 'b1', title: 'B1' },
      ],
    });
    hooks.useGrammarResultSession.mockReturnValue({
      session: {
        clientAttemptId: 'attempt-1',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        correctCount: 9,
        totalCount: 10,
        score: 90,
        completed: true,
        answers: [],
        startedAt: 'x',
        completedAt: 'y',
      },
      isLoading: false,
    });

    rq.useMutationState.mockReturnValue([
      { status: 'pending', isPaused: true, variables: { clientAttemptId: 'attempt-1' } },
    ]);
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarResultScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Waiting for connection')),
    ).toBe(true);

    rq.useMutationState.mockReturnValue([
      { status: 'pending', isPaused: false, variables: { clientAttemptId: 'attempt-1' } },
    ]);
    await act(() => {
      root.update(<GrammarResultScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Saving progress')),
    ).toBe(true);

    rq.useMutationState.mockReturnValue([
      { status: 'error', isPaused: false, variables: { clientAttemptId: 'attempt-1' } },
    ]);
    await act(() => {
      root.update(<GrammarResultScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-result-retry-save' }).props.onPress();
    });
    expect(mockMutate).toHaveBeenCalled();

    rq.useMutationState.mockReturnValue([
      { status: 'success', isPaused: false, variables: { clientAttemptId: 'attempt-1' } },
    ]);
    await act(() => {
      root.update(<GrammarResultScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Progress saved')),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'grammar-result-next' }).props.onPress();
    });
    expect(mockExitFlow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: 'GrammarLesson',
        params: { topicId: 'topic-1', lessonId: 'lesson-2' },
      }),
    );

    hooks.useGrammarResultSession.mockReturnValue({
      session: {
        clientAttemptId: 'attempt-1',
        topicId: 'topic-1',
        lessonId: 'lesson-2',
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
    rq.useMutationState.mockReturnValue([]);
    await act(() => {
      root.update(<GrammarResultScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-result-home' }).props.onPress();
    });
    expect(mockExitFlow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name: 'GrammarTopic' }),
    );

    hooks.useGrammarResultSession.mockReturnValue({
      session: {
        clientAttemptId: 'attempt-1',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        correctCount: 3,
        totalCount: 10,
        score: 30,
        completed: false,
        answers: [],
        startedAt: 'x',
        completedAt: 'y',
      },
      isLoading: false,
    });
    await act(() => {
      root.update(<GrammarResultScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Keep practicing')),
    ).toBe(true);
  });
});
