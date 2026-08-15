import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { ReviewScreen } from '@/features/vocabulary/screens/ReviewScreen';

import { FIXTURE_CHOOSE, FIXTURE_FILL } from '../../../../helpers/vocabularyFixtures';

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

jest.mock('@/features/vocabulary/navigation/exitPracticeFlow', () => ({
  exitVocabularyPracticeFlow: (...args: unknown[]) => mockExitFlow(...args),
}));

jest.mock('@/features/vocabulary/hooks', () => ({
  useCompleteVocabularyAttempt: jest.fn(),
  vocabularyErrorMessage: jest.fn((_err: unknown, fallback: string) => fallback),
}));

jest.mock('@/features/vocabulary/session', () => ({
  usePracticeSession: jest.fn(),
}));

const hooks = jest.requireMock('@/features/vocabulary/hooks') as {
  useCompleteVocabularyAttempt: jest.Mock;
};
const session = jest.requireMock('@/features/vocabulary/session') as {
  usePracticeSession: jest.Mock;
};
const auth = jest.requireMock('@/core/auth/AuthProvider') as { useAuth: jest.Mock };

const baseState = {
  exercises: [FIXTURE_CHOOSE, FIXTURE_FILL],
  checked: [
    { exerciseId: FIXTURE_CHOOSE.id, correct: false, selectedIds: ['opt_b'] },
    { exerciseId: FIXTURE_FILL.id, correct: false, selectedIds: [], skipped: true },
  ],
  situationId: 'task-progress',
  situationSlug: 'task-progress',
};

const completedSnapshot = {
  phase: 'completed' as const,
  score: 50,
  completed: false,
  clientAttemptId: 'attempt-1',
  situationId: 'task-progress',
  situationSlug: 'task-progress',
  contentRevision: 1,
  correctCount: 0,
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

describe('Vocabulary ReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.useAuth.mockReturnValue({ user: { id: 'user-1' } });
    hooks.useCompleteVocabularyAttempt.mockReturnValue({
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
      root = ReactTestRenderer.create(<ReviewScreen />);
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

  it('reopens wrong/skipped rows and submits', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<ReviewScreen />);
    });

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-review-row-0' }).props.onPress();
    });
    expect(applyAction).toHaveBeenCalledWith({ type: 'reopen', index: 0 });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyPractice', {
      situationId: 'task-progress',
    });

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-review-submit' }).props.onPress();
    });
    expect(commitCompletedSession).toHaveBeenCalled();
    expect(mutate).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('blocks submit while pending and ignores reopen when not answering', async () => {
    hooks.useCompleteVocabularyAttempt.mockReturnValue({
      isPending: true,
      isPaused: false,
      mutate,
    });
    applyAction.mockReturnValue({ phase: 'reviewing' });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<ReviewScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-review-submit' }).props.onPress();
    });
    expect(mutate).not.toHaveBeenCalled();
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-review-row-0' }).props.onPress();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    await act(() => {
      root.root.findByProps({ title: 'Review answers' }).props.onBackPress();
    });
    expect(mockGoBack).not.toHaveBeenCalled();

    // submit when applyAction does not complete
    hooks.useCompleteVocabularyAttempt.mockReturnValue({
      isPending: false,
      isPaused: false,
      mutate,
    });
    applyAction.mockReturnValue({ phase: 'reviewing' });
    await act(() => {
      root.update(<ReviewScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-review-submit' }).props.onPress();
    });
    expect(mutate).not.toHaveBeenCalled();

    // reopen when applyAction does not enter answering
    applyAction.mockReturnValue({ phase: 'reviewing' });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-review-row-0' }).props.onPress();
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    // correct row is not reopenable
    session.usePracticeSession.mockReturnValue({
      state: {
        ...baseState,
        checked: [
          { exerciseId: FIXTURE_CHOOSE.id, correct: true, selectedIds: ['opt_a'] },
          { exerciseId: FIXTURE_FILL.id, correct: true, selectedIds: [] },
        ],
      },
      applyAction,
      commitCompletedSession,
      clearActiveSession,
    });
    await act(() => {
      root.update(<ReviewScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-review-row-0' }).props.onPress();
    });
  });

  it('requires sign-in and falls back when cannot go back', async () => {
    auth.useAuth.mockReturnValue({ user: null });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<ReviewScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-review-submit' }).props.onPress();
    });
    expect(root.root.findByProps({ testID: 'vocabulary-review-submit-error' })).toBeTruthy();

    mockCanGoBack.mockReturnValueOnce(false);
    await act(() => {
      root.root.findByProps({ title: 'Review answers' }).props.onBackPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyPractice', {
      situationId: 'task-progress',
    });
  });

  it('reopens and backs into weak practice with mode=weak', async () => {
    applyAction.mockReturnValue({ phase: 'answering' });
    session.usePracticeSession.mockReturnValue({
      state: {
        ...baseState,
        situationId: 'weak',
        situationSlug: 'weak',
      },
      applyAction,
      commitCompletedSession,
      clearActiveSession,
    });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<ReviewScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-review-row-0' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyPractice', {
      situationId: 'weak',
      mode: 'weak',
    });

    mockNavigate.mockClear();
    mockCanGoBack.mockReturnValueOnce(false);
    await act(() => {
      root.root.findByProps({ title: 'Review answers' }).props.onBackPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyPractice', {
      situationId: 'weak',
      mode: 'weak',
    });
  });
});
