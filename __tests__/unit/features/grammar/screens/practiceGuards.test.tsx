import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { GrammarPracticeScreen } from '@/features/grammar/screens/GrammarPracticeScreen';

import { FIXTURE_MC } from '../../../../helpers/grammarFixtures';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let beforeRemoveHandler: ((event: unknown) => void) | null = null;

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
      goBack: mockGoBack,
      dispatch: jest.fn(),
      addListener: (_event: string, handler: (event: unknown) => void) => {
        beforeRemoveHandler = handler;
        return () => {
          beforeRemoveHandler = null;
        };
      },
    }),
    useRoute: () => ({
      params: { topicId: 'topic-1', lessonId: 'lesson-1' },
    }),
  };
});

jest.mock('@/features/grammar/components/PracticeProgressBar', () => {
  const { Pressable } = require('react-native') as typeof import('react-native');
  return {
    PracticeProgressBar: ({ onBack, onSkip }: { onBack?: () => void; onSkip?: () => void }) => (
      <>
        <Pressable testID="force-skip" onPress={onSkip} />
        <Pressable testID="force-back" onPress={onBack} />
      </>
    ),
  };
});

jest.mock('@/features/grammar/hooks', () => {
  const actual = jest.requireActual(
    '@/features/grammar/hooks',
  ) as typeof import('@/features/grammar/hooks');
  const { FIXTURE_MC: fixtureMc } = jest.requireActual(
    '../../../../helpers/grammarFixtures',
  ) as typeof import('../../../../helpers/grammarFixtures');
  return {
    ...actual,
    useGrammarTopic: jest.fn(() => ({
      isLoading: false,
      isError: false,
      data: { id: 'topic-1', title: 'Present Simple', slug: 'present-simple' },
      refetch: jest.fn(),
    })),
    useGrammarLesson: jest.fn(() => ({
      isLoading: false,
      isError: false,
      data: { id: 'lesson-1', title: 'A2', contentRevision: 1 },
      refetch: jest.fn(),
    })),
    useGrammarExercises: jest.fn(() => ({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: fixtureMc.id,
          exerciseKey: fixtureMc.id,
          topicId: 'topic-1',
          lessonId: 'lesson-1',
          type: fixtureMc.type,
          prompt: fixtureMc.prompt,
          explanation: fixtureMc.explanation,
          sortOrder: fixtureMc.sortOrder,
          contentSchemaVersion: 1,
          payload: fixtureMc.payload,
          answer: fixtureMc.answer,
        },
      ],
      refetch: jest.fn(),
    })),
    useCompleteGrammarAttempt: jest.fn(() => ({
      isPending: false,
      isPaused: false,
      mutate: jest.fn(),
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

const session = jest.requireMock('@/features/grammar/session') as {
  usePracticeSession: jest.Mock;
};

describe('GrammarPracticeScreen defensive guards', () => {
  it('invokes skip/back when progress bar does not gate them', async () => {
    const applyAction = jest.fn(() => ({ phase: 'answering' }));
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [FIXTURE_MC],
        index: 0,
        phase: 'checked',
        response: null,
        lastCorrect: true,
        lastExplanation: 'x',
        checked: [],
        correctCount: 0,
        clientAttemptId: 'a1',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
        resumeReviewOnBack: false,
        reopenedPrior: null,
      },
      dispatch: jest.fn(),
      applyAction,
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarPracticeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'force-skip' }).props.onPress();
    });
    await act(async () => {
      await Promise.resolve();
      root.root.findByProps({ testID: 'force-back' }).props.onPress();
    });
    expect(applyAction).toHaveBeenCalledWith({ type: 'skip' });
    expect(applyAction).toHaveBeenCalledWith({ type: 'back' });
    expect(beforeRemoveHandler).toBeTruthy();
  });
});
