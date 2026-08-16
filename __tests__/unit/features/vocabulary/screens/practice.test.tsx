import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { PracticeScreen } from '@/features/vocabulary/screens/PracticeScreen';

import {
  FIXTURE_CHOOSE,
  FIXTURE_EXERCISES,
  FIXTURE_FILL,
  FIXTURE_ORDER,
} from '../../../../helpers/vocabularyFixtures';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockDispatchNav = jest.fn();
let beforeRemoveHandler:
  | ((event: { preventDefault: () => void; data: { action: { type: string } } }) => void)
  | null = null;

const routeParams: { situationId: string; mode?: 'situation' | 'weak' } = {
  situationId: 'task-progress',
  mode: 'situation',
};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
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
      goBack: mockGoBack,
      dispatch: mockDispatchNav,
      addListener: (_event: string, handler: typeof beforeRemoveHandler) => {
        beforeRemoveHandler = handler;
        return () => {
          beforeRemoveHandler = null;
        };
      },
    }),
    useRoute: () => ({
      params: routeParams,
    }),
  };
});

jest.mock('@/features/vocabulary/data/knownItemsStore', () => ({
  loadKnownItemIds: jest.fn(async () => new Set<string>()),
}));

jest.mock('@/features/vocabulary/hooks', () => {
  const actual = jest.requireActual(
    '@/features/vocabulary/hooks',
  ) as typeof import('@/features/vocabulary/hooks');
  return {
    ...actual,
    useVocabularySituation: jest.fn(),
    useVocabularyExercises: jest.fn(),
    useVocabularyWeakProgress: jest.fn(),
    useVocabularyWeakExercises: jest.fn(),
  };
});

jest.mock('@/features/vocabulary/session', () => {
  const actual = jest.requireActual(
    '@/features/vocabulary/session',
  ) as typeof import('@/features/vocabulary/session');
  return {
    ...actual,
    usePracticeSession: jest.fn(),
  };
});

const hooks = jest.requireMock('@/features/vocabulary/hooks') as {
  useVocabularySituation: jest.Mock;
  useVocabularyExercises: jest.Mock;
  useVocabularyWeakProgress: jest.Mock;
  useVocabularyWeakExercises: jest.Mock;
};
const session = jest.requireMock('@/features/vocabulary/session') as {
  usePracticeSession: jest.Mock;
};

function makeSessionState(overrides: Record<string, unknown> = {}) {
  return {
    exercises: [FIXTURE_CHOOSE],
    index: 0,
    phase: 'answering',
    response: null,
    lastCorrect: null,
    lastExplanation: null,
    checked: [],
    correctCount: 0,
    clientAttemptId: 'attempt-1',
    situationId: 'task-progress',
    situationSlug: 'task-progress',
    contentRevision: 1,
    startedAt: 'x',
    completedAt: null,
    score: null,
    completed: null,
    resumeReviewOnBack: false,
    reopenedPrior: null,
    ...overrides,
  };
}

describe('Vocabulary PracticeScreen', () => {
  const dispatch = jest.fn();
  const applyAction = jest.fn((action: { type: string }) => {
    if (action.type === 'continue' || action.type === 'skip') {
      return { phase: 'answering' };
    }
    if (action.type === 'back') {
      return { phase: 'answering' };
    }
    return makeSessionState();
  });
  const startSession = jest.fn();
  const clearActiveSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    beforeRemoveHandler = null;
    routeParams.situationId = 'task-progress';
    routeParams.mode = 'situation';

    hooks.useVocabularySituation.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: {
        id: 'task-progress',
        slug: 'task-progress',
        title: 'Task & Progress',
        description: 'x',
        total: 10,
        coreItemIds: Array.from({ length: 8 }, (_, index) => `task-progress:extra-${index}`),
        itemIds: Array.from({ length: 8 }, (_, index) => `task-progress:extra-${index}`),
      },
      error: null,
      refetch: jest.fn(async () => undefined),
    });
    hooks.useVocabularyExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: FIXTURE_EXERCISES.concat(
        Array.from({ length: 8 }, (_, index) => ({
          ...FIXTURE_CHOOSE,
          id: `extra-${index}`,
          itemId: `task-progress:extra-${index}`,
        })),
      ),
      error: null,
      refetch: jest.fn(async () => undefined),
    });
    hooks.useVocabularyWeakProgress.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [{ itemId: 'task-progress:blocker', incorrectCount: 2, correctCount: 0 }],
      error: null,
      refetch: jest.fn(async () => undefined),
    });
    hooks.useVocabularyWeakExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: FIXTURE_EXERCISES,
      error: null,
      refetch: jest.fn(async () => undefined),
    });
    session.usePracticeSession.mockReturnValue({
      state: makeSessionState(),
      dispatch,
      applyAction,
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });
  });

  it('starts a session and checks a choose answer', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<PracticeScreen />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(startSession).toHaveBeenCalled();
    expect(root.root.findByProps({ testID: 'vocabulary-practice' })).toBeTruthy();

    await act(() => {
      root.root.findAllByProps({ accessibilityRole: 'button' })[0]?.props.onPress?.();
    });
  });

  it('shows loading, error, empty, and insufficient states', async () => {
    hooks.useVocabularyExercises.mockReturnValue({
      isLoading: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      refetch: jest.fn(),
    });
    session.usePracticeSession.mockReturnValue({
      state: makeSessionState({ exercises: [] }),
      dispatch,
      applyAction,
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<PracticeScreen />);
      await Promise.resolve();
    });
    expect(root.root.findByProps({ testID: 'vocabulary-practice-loading' })).toBeTruthy();

    hooks.useVocabularyExercises.mockReturnValue({
      isLoading: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      error: new Error('down'),
      refetch: jest.fn(async () => undefined),
    });
    await act(() => {
      root.update(<PracticeScreen />);
    });
    expect(root.root.findByProps({ testID: 'vocabulary-practice-retry' })).toBeTruthy();
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-practice-retry' }).props.onPress();
    });

    hooks.useVocabularyExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [],
      refetch: jest.fn(),
    });
    await act(() => {
      root.update(<PracticeScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('enough published')),
    ).toBe(true);

    const { loadKnownItemIds } = jest.requireMock('@/features/vocabulary/data/knownItemsStore') as {
      loadKnownItemIds: jest.Mock;
    };
    loadKnownItemIds.mockResolvedValue(new Set(['task-progress:blocker']));
    hooks.useVocabularySituation.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: {
        id: 'task-progress',
        slug: 'task-progress',
        title: 'Task & Progress',
        description: 'x',
        total: 10,
        coreItemIds: ['task-progress:blocker'],
      },
      error: null,
      refetch: jest.fn(async () => undefined),
    });
    hooks.useVocabularyExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: FIXTURE_EXERCISES.concat(
        Array.from({ length: 8 }, (_, index) => ({
          ...FIXTURE_CHOOSE,
          id: `core-fallback-${index}`,
          itemId: `task-progress:extra-${index}`,
        })),
      ),
      refetch: jest.fn(),
    });
    startSession.mockClear();
    await act(async () => {
      root.update(<PracticeScreen />);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('enough published')),
    ).toBe(true);
    expect(startSession).not.toHaveBeenCalled();
  });

  it('handles primary check/continue, skip, header back, and leave modal', async () => {
    const state = makeSessionState({
      response: { type: 'choose_expression', optionId: 'opt_a' },
    });
    session.usePracticeSession.mockReturnValue({
      state,
      dispatch,
      applyAction,
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<PracticeScreen />);
      await Promise.resolve();
    });

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-practice-action' }).props.onPress();
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'check' });

    session.usePracticeSession.mockReturnValue({
      state: makeSessionState({
        phase: 'checked',
        lastCorrect: true,
        lastExplanation: 'Because',
        checked: [{ exerciseId: FIXTURE_CHOOSE.id, correct: true, selectedIds: ['opt_a'] }],
        correctCount: 1,
        response: { type: 'choose_expression', optionId: 'opt_a' },
      }),
      dispatch,
      applyAction: jest.fn(() => ({ phase: 'reviewing' })),
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });
    await act(() => {
      root.update(<PracticeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-practice-action' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyReview');

    session.usePracticeSession.mockReturnValue({
      state: makeSessionState(),
      dispatch,
      applyAction: jest.fn(() => ({ phase: 'answering' })),
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });
    await act(() => {
      root.update(<PracticeScreen />);
    });
    const progress = root.root.findByProps({ canSkip: true });
    await act(() => {
      progress.props.onSkip();
    });

    await act(() => {
      root.root.findByProps({ title: 'Task & Progress' }).props.onBackPress();
    });
    expect(mockGoBack).toHaveBeenCalled();

    const preventDefault = jest.fn();
    expect(beforeRemoveHandler).toBeTruthy();
    await act(() => {
      beforeRemoveHandler?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });
    expect(preventDefault).toHaveBeenCalled();
  });

  it('renders fill and order exercise views', async () => {
    session.usePracticeSession.mockReturnValue({
      state: makeSessionState({
        exercises: [FIXTURE_FILL],
        response: { type: 'fill_blank', text: 'blocker' },
      }),
      dispatch,
      applyAction,
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<PracticeScreen />);
      await Promise.resolve();
    });
    expect(root.root.findByProps({ testID: 'vocabulary-exercise-fill' })).toBeTruthy();

    session.usePracticeSession.mockReturnValue({
      state: makeSessionState({
        exercises: [FIXTURE_ORDER],
        response: { type: 'sentence_order', tokenIds: ['t1', 't2', 't3'] },
      }),
      dispatch,
      applyAction,
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });
    await act(() => {
      root.update(<PracticeScreen />);
    });
    expect(root.root.findByProps({ testID: 'vocabulary-exercise-order' })).toBeTruthy();
  });

  it('opens review banner when phase is reviewing', async () => {
    session.usePracticeSession.mockReturnValue({
      state: makeSessionState({ phase: 'reviewing' }),
      dispatch,
      applyAction,
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<PracticeScreen />);
      await Promise.resolve();
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-practice-open-review' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyReview');
  });

  it('handles leave confirm, resume-review back, weak mode, and fill validation', async () => {
    const apply = jest.fn((action: { type: string }) => {
      if (action.type === 'back') {
        return { phase: 'reviewing' };
      }
      return { phase: 'answering' };
    });
    session.usePracticeSession.mockReturnValue({
      state: makeSessionState({
        resumeReviewOnBack: true,
        checked: [{ exerciseId: FIXTURE_CHOOSE.id, correct: false, selectedIds: [] }],
      }),
      dispatch,
      applyAction: apply,
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<PracticeScreen />);
      await Promise.resolve();
    });

    await act(() => {
      root.root.findByProps({ title: 'Task & Progress' }).props.onBackPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyReview');

    const preventDefault = jest.fn();
    await act(() => {
      beforeRemoveHandler?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });
    expect(preventDefault).toHaveBeenCalled();

    // Confirm leave path when not resume-review
    session.usePracticeSession.mockReturnValue({
      state: makeSessionState(),
      dispatch,
      applyAction: apply,
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });
    await act(() => {
      root.update(<PracticeScreen />);
    });
    await act(() => {
      beforeRemoveHandler?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });
    const modal = root.root.findByProps({ title: 'Leave practice?' });
    await act(() => {
      modal.props.onCancel();
    });
    await act(() => {
      beforeRemoveHandler?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });
    await act(() => {
      root.root.findByProps({ title: 'Leave practice?' }).props.onConfirm();
    });
    expect(clearActiveSession).toHaveBeenCalled();

    routeParams.mode = 'weak';
    hooks.useVocabularyExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: FIXTURE_EXERCISES.concat(
        Array.from({ length: 8 }, (_, index) => ({
          ...FIXTURE_CHOOSE,
          id: `weak-${index}`,
          itemId: 'task-progress:blocker',
        })),
      ),
      error: null,
      refetch: jest.fn(async () => undefined),
    });
    await act(() => {
      root.update(<PracticeScreen />);
    });
    expect(startSession).toHaveBeenCalled();

    session.usePracticeSession.mockReturnValue({
      state: makeSessionState({
        exercises: [FIXTURE_FILL],
        response: { type: 'fill_blank', text: '   ' },
      }),
      dispatch,
      applyAction: apply,
      startSession,
      clearActiveSession,
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });
    await act(() => {
      root.update(<PracticeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-practice-action' }).props.onPress();
    });
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'check' });
  });
});
