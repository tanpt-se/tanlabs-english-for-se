import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { PracticeScreen } from '@/features/vocabulary/screens/PracticeScreen';

import { FIXTURE_CHOOSE, FIXTURE_EXERCISES } from '../../../../helpers/vocabularyFixtures';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockDispatchNav = jest.fn();
let beforeRemoveHandler: ((event: unknown) => void) | null = null;

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => {
    throw new Error('analytics down');
  }),
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
      addListener: (_event: string, handler: (event: unknown) => void) => {
        beforeRemoveHandler = handler;
        return () => {
          beforeRemoveHandler = null;
        };
      },
    }),
    useRoute: () => ({
      params: { situationId: 'task-progress', mode: 'situation' },
    }),
  };
});

jest.mock('@/features/vocabulary/data/knownItemsStore', () => ({
  loadKnownItemIds: jest.fn(async () => new Set<string>()),
}));

jest.mock('@/features/vocabulary/components/PracticeProgressBar', () => {
  const { Pressable } = require('react-native') as typeof import('react-native');
  return {
    PracticeProgressBar: ({ onBack, onSkip }: { onBack?: () => void; onSkip?: () => void }) => (
      <>
        <Pressable accessibilityRole="button" testID="force-skip" onPress={onSkip} />
        <Pressable accessibilityRole="button" testID="force-back" onPress={onBack} />
      </>
    ),
  };
});

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

const pool = FIXTURE_EXERCISES.concat(
  Array.from({ length: 8 }, (_, index) => ({
    ...FIXTURE_CHOOSE,
    id: `extra-${index}`,
    itemId: `task-progress:extra-${index}`,
  })),
);

describe('PracticeScreen defensive handler branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      refetch: jest.fn(),
    });
    hooks.useVocabularyExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: pool,
      refetch: jest.fn(),
    });
    hooks.useVocabularyWeakProgress.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: jest.fn(),
    });
    hooks.useVocabularyWeakExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [],
      refetch: jest.fn(),
    });
  });

  it('covers skip/back guards, choose select, and analytics failure', async () => {
    const dispatch = jest.fn();
    const applyAction = jest.fn(() => ({ phase: 'answering' }));
    const startSession = jest.fn();
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [FIXTURE_CHOOSE],
        index: 0,
        phase: 'checked',
        response: { type: 'choose_expression', optionId: 'opt_a' },
        lastCorrect: true,
        lastExplanation: 'Because',
        checked: [],
        correctCount: 0,
        clientAttemptId: 'a1',
        situationId: 'task-progress',
        situationSlug: 'task-progress',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
        resumeReviewOnBack: false,
        reopenedPrior: null,
      },
      dispatch,
      applyAction,
      startSession,
      clearActiveSession: jest.fn(),
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<PracticeScreen />);
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(() => {
      root.root.findByProps({ testID: 'force-skip' }).props.onPress();
      root.root.findByProps({ testID: 'force-back' }).props.onPress();
    });

    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [FIXTURE_CHOOSE],
        index: 0,
        phase: 'answering',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'a1',
        situationId: 'task-progress',
        situationSlug: 'task-progress',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
        resumeReviewOnBack: false,
        reopenedPrior: null,
      },
      dispatch,
      applyAction,
      startSession,
      clearActiveSession: jest.fn(),
      getActiveState: jest.fn(() => session.usePracticeSession.mock.results.at(-1)?.value.state),
    });
    await act(() => {
      root.update(<PracticeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'force-back' }).props.onPress();
      const option = root.root
        .findByProps({ testID: 'vocabulary-exercise-choose' })
        .findAllByProps({ accessibilityRole: 'button' })[0];
      option?.props.onPress?.();
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'set_response',
        response: expect.objectContaining({ type: 'choose_expression' }),
      }),
    );
    expect(startSession).toHaveBeenCalled();
    expect(beforeRemoveHandler).toBeTruthy();
  });
});
