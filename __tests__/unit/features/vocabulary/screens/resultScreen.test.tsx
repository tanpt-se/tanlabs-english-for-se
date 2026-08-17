import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { PracticeResultScreen } from '@/features/vocabulary/screens/PracticeResultScreen';

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

jest.mock('@/features/vocabulary/navigation/exitPracticeFlow', () => ({
  exitVocabularyPracticeFlow: (...args: unknown[]) => mockExitFlow(...args),
}));

jest.mock('@/features/vocabulary/session', () => ({
  usePracticeSession: () => ({ clearActiveSession: mockClear }),
}));

jest.mock('@/features/vocabulary/hooks', () => ({
  useVocabularyResultSession: jest.fn(),
  useVocabularySituation: jest.fn(),
  useCompleteVocabularyAttempt: jest.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    isPaused: false,
  })),
}));

jest.mock('@/features/home/hooks/usePracticeStreak', () => ({
  useStreakCelebration: jest.fn(() => ({ visible: false, dismiss: jest.fn() })),
}));

const hooks = jest.requireMock('@/features/vocabulary/hooks') as {
  useVocabularyResultSession: jest.Mock;
  useVocabularySituation: jest.Mock;
};
const rq = jest.requireMock('@tanstack/react-query') as { useMutationState: jest.Mock };

const baseSession = {
  clientAttemptId: 'attempt-1',
  situationId: 'task-progress',
  situationSlug: 'task-progress',
  contentRevision: 1,
  correctCount: 7,
  totalCount: 10,
  score: 70,
  completed: true,
  answers: [],
  itemResults: [],
  startedAt: 'x',
  completedAt: 'y',
};

describe('Vocabulary PracticeResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rq.useMutationState.mockReturnValue([]);
    hooks.useVocabularySituation.mockReturnValue({
      data: { title: 'Task & Progress', slug: 'task-progress' },
    });
  });

  it('shows loading then missing session copy', async () => {
    hooks.useVocabularyResultSession.mockReturnValue({ session: null, isLoading: true });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<PracticeResultScreen />);
    });
    expect(root.root.findByProps({ testID: 'vocabulary-result-loading' })).toBeTruthy();

    hooks.useVocabularyResultSession.mockReturnValue({ session: null, isLoading: false });
    await act(() => {
      root.update(<PracticeResultScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('isn’t available')),
    ).toBe(true);
  });

  it('retries, opens weak items, and retries save on error', async () => {
    hooks.useVocabularyResultSession.mockReturnValue({
      session: baseSession,
      isLoading: false,
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<PracticeResultScreen />);
    });

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-result-retry' }).props.onPress();
    });
    expect(mockClear).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-result-weak' }).props.onPress();
    });
    expect(mockExitFlow).toHaveBeenCalledWith(expect.anything(), { name: 'VocabularyWeak' });

    rq.useMutationState.mockReturnValue([
      {
        status: 'error',
        isPaused: false,
        variables: { clientAttemptId: 'attempt-1' },
      },
    ]);
    await act(() => {
      root.update(<PracticeResultScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-result-retry-save' }).props.onPress();
    });
    expect(mockMutate).toHaveBeenCalled();
  });

  it('exits home when perfect score', async () => {
    hooks.useVocabularyResultSession.mockReturnValue({
      session: { ...baseSession, correctCount: 10, score: 100, completed: true },
      isLoading: false,
    });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<PracticeResultScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-result-home' }).props.onPress();
    });
    expect(mockExitFlow).toHaveBeenCalledWith(expect.anything(), { name: 'VocabularyHome' });
  });

  it('covers paused/pending/incomplete save messaging', async () => {
    hooks.useVocabularyResultSession.mockReturnValue({
      session: { ...baseSession, completed: false, score: 40, correctCount: 4 },
      isLoading: false,
    });
    rq.useMutationState.mockReturnValue([
      {
        status: 'pending',
        isPaused: true,
        variables: { clientAttemptId: 'attempt-1' },
      },
    ]);
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<PracticeResultScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Waiting for connection')),
    ).toBe(true);

    rq.useMutationState.mockReturnValue([
      {
        status: 'pending',
        isPaused: false,
        variables: { clientAttemptId: 'attempt-1' },
      },
    ]);
    await act(() => {
      root.update(<PracticeResultScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Saving progress')),
    ).toBe(true);

    rq.useMutationState.mockReturnValue([
      {
        status: 'success',
        isPaused: false,
        variables: { clientAttemptId: 'attempt-1' },
      },
    ]);
    await act(() => {
      root.update(<PracticeResultScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Not complete yet')),
    ).toBe(true);

    // singular needs-practice copy + success completed with one miss
    hooks.useVocabularyResultSession.mockReturnValue({
      session: {
        ...baseSession,
        completed: true,
        score: 90,
        correctCount: 9,
        totalCount: 10,
      },
      isLoading: false,
    });
    rq.useMutationState.mockReturnValue([
      {
        status: 'success',
        isPaused: false,
        variables: { clientAttemptId: 'attempt-1' },
      },
    ]);
    await act(() => {
      root.update(<PracticeResultScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Review 1 answer')),
    ).toBe(true);

    // retry without session falls back home
    hooks.useVocabularyResultSession.mockReturnValue({ session: null, isLoading: false });
    await act(() => {
      root.update(<PracticeResultScreen />);
    });

    await act(() => {
      root.root.findByProps({ title: 'Practice result' }).props.onBackPress();
    });
    expect(mockExitFlow).toHaveBeenCalledWith(expect.anything(), { name: 'VocabularyHome' });
  });
});
