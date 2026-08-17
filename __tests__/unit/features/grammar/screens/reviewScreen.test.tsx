import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { GrammarReviewScreen } from '@/features/grammar/screens/GrammarReviewScreen';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockExitFlow = jest.fn();

const mutate = jest.fn();
const applyAction = jest.fn();
const commitCompletedSession = jest.fn();
const clearActiveSession = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual(
    '@react-navigation/native',
  ) as typeof import('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      dispatch: mockDispatch,
      goBack: mockGoBack,
      canGoBack: mockCanGoBack,
    }),
    CommonActions: {
      reset: (payload: unknown) => ({ type: 'RESET', payload }),
    },
  };
});

jest.mock('@/features/grammar/navigation/exitPracticeFlow', () => ({
  exitGrammarPracticeFlow: (...args: unknown[]) => mockExitFlow(...args),
}));

jest.mock('@/features/grammar/hooks', () => ({
  useCompleteGrammarAttempt: jest.fn(),
  grammarErrorMessage: jest.fn((_err: unknown, fallback: string) => fallback),
}));

jest.mock('@/features/grammar/session', () => ({
  usePracticeSession: jest.fn(),
}));

const hooks = jest.requireMock('@/features/grammar/hooks') as {
  useCompleteGrammarAttempt: jest.Mock;
};
const session = jest.requireMock('@/features/grammar/session') as {
  usePracticeSession: jest.Mock;
};

const baseState = {
  exercises: [
    { id: 'e1', type: 'multiple_choice', prompt: 'Choose: ___', explanation: 'x' },
    { id: 'e2', type: 'multiple_choice', prompt: 'Choose: ___', explanation: 'y' },
  ],
  checked: [
    { exerciseId: 'e1', correct: false, selectedIds: ['a'] },
    { exerciseId: 'e2', correct: true, selectedIds: ['b'] },
  ],
  topicId: 'topic-1',
  lessonId: 'lesson-1',
};

const completedSnapshot = {
  phase: 'completed' as const,
  score: 50,
  completed: false,
  clientAttemptId: 'attempt-1',
  topicId: 'topic-1',
  lessonId: 'lesson-1',
  contentRevision: 1,
  correctCount: 1,
  exercises: baseState.exercises,
  checked: baseState.checked,
  startedAt: 'x',
  completedAt: 'y',
  index: 0,
  response: null,
  lastCorrect: null,
  lastExplanation: null,
  resumeReviewOnBack: false,
  reopenedPrior: null,
};

describe('GrammarReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hooks.useCompleteGrammarAttempt.mockReturnValue({
      isPending: false,
      isPaused: false,
      mutate,
    });
    session.usePracticeSession.mockReturnValue({
      state: baseState,
      applyAction,
      commitCompletedSession,
      clearActiveSession,
    });
    applyAction.mockImplementation((action: { type: string; index?: number }) => {
      if (action.type === 'reopen') {
        return { phase: 'answering' };
      }
      if (action.type === 'submit') {
        return completedSnapshot;
      }
      return { phase: 'reviewing' };
    });
  });

  it('shows empty state and exits to home from header back', async () => {
    session.usePracticeSession.mockReturnValue({
      state: { ...baseState, exercises: [], checked: [] },
      applyAction,
      commitCompletedSession,
      clearActiveSession,
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarReviewScreen />);
    });

    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('No active')),
    ).toBe(true);
    const header = root.root.findByProps({ title: 'Review answers' });
    await act(() => {
      header.props.onBackPress();
    });
    expect(clearActiveSession).toHaveBeenCalled();
    expect(mockExitFlow).toHaveBeenCalled();
  });

  it('reopens only skipped/wrong rows and handles back fallback route', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarReviewScreen />);
    });

    await act(() => {
      root.root.findByProps({ testID: 'grammar-review-row-0' }).props.onPress();
      root.root.findByProps({ testID: 'grammar-review-row-1' }).props.onPress();
    });
    expect(applyAction).toHaveBeenCalledWith({ type: 'reopen', index: 0 });
    expect(applyAction).not.toHaveBeenCalledWith({ type: 'reopen', index: 1 });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarPractice', {
      topicId: 'topic-1',
      lessonId: 'lesson-1',
    });

    mockCanGoBack.mockReturnValue(false);
    const header = root.root.findByProps({ title: 'Review answers' });
    await act(() => {
      header.props.onBackPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarPractice', {
      topicId: 'topic-1',
      lessonId: 'lesson-1',
    });
  });

  it('shows skipped status and blocks reopen/back/submit while pending', async () => {
    mockCanGoBack.mockReturnValue(true);
    hooks.useCompleteGrammarAttempt.mockReturnValue({
      isPending: true,
      isPaused: false,
      mutate,
    });
    session.usePracticeSession.mockReturnValue({
      state: {
        ...baseState,
        checked: [{ exerciseId: 'e1', correct: false, selectedIds: [], skipped: true }],
      },
      applyAction,
      commitCompletedSession,
      clearActiveSession,
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarReviewScreen />);
    });

    expect(root.root.findAllByType(Text).some((node) => node.props.children === 'Skipped')).toBe(
      true,
    );
    await act(() => {
      root.root.findByProps({ testID: 'grammar-review-row-0' }).props.onPress();
    });
    expect(applyAction).not.toHaveBeenCalled();

    const header = root.root.findByProps({ title: 'Review answers' });
    await act(() => {
      header.props.onBackPress();
    });
    expect(mockGoBack).not.toHaveBeenCalled();

    await act(() => {
      root.root.findByProps({ testID: 'grammar-review-submit' }).props.onPress();
    });
    expect(commitCompletedSession).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('does not navigate when reopen is rejected by reducer', async () => {
    applyAction.mockReturnValue({ phase: 'completed' });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarReviewScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-review-row-0' }).props.onPress();
    });
    expect(applyAction).toHaveBeenCalledWith({ type: 'reopen', index: 0 });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('surfaces an error when submit does not complete the attempt', async () => {
    applyAction.mockReturnValue({ phase: 'reviewing' });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarReviewScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-review-submit' }).props.onPress();
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Couldn’t submit yet')),
    ).toBe(true);
    expect(commitCompletedSession).not.toHaveBeenCalled();
  });

  it('commits locally, enqueues mutation, and opens Result without waiting for ack', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarReviewScreen />);
    });

    await act(() => {
      root.root.findByProps({ testID: 'grammar-review-submit' }).props.onPress();
    });

    expect(commitCompletedSession).toHaveBeenCalledWith(completedSnapshot);
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        clientAttemptId: 'attempt-1',
        score: 50,
      }),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RESET',
      }),
    );
  });
});
