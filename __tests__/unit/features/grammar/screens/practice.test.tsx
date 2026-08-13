import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { FillBlankExerciseView, MultipleChoiceExerciseView } from '@/features/grammar/components';
import { GrammarNavigator } from '@/features/grammar/navigation/GrammarNavigator';
import { GrammarPracticeScreen } from '@/features/grammar/screens/GrammarPracticeScreen';
import { GrammarReviewScreen } from '@/features/grammar/screens/GrammarReviewScreen';
import { createClientAttemptId, mapPublishedExercise } from '@/features/grammar/session';
import { practiceReducer } from '@/features/grammar/utils';
import { formatCorrectAnswer } from '@/features/grammar/utils/formatCorrectAnswer';

import {
  FIXTURE_FILL,
  FIXTURE_MC,
  FIXTURE_MC_SECOND,
  FIXTURE_ORDER,
} from '../../../../helpers/grammarFixtures';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();
const mockDispatchNav = jest.fn();
let beforeRemoveHandler:
  | ((event: { preventDefault: () => void; data: { action: { type: string } } }) => void)
  | null = null;

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Screen: () => null,
  }),
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
      dispatch: mockDispatchNav,
      canGoBack: () => true,
      getState: () => ({
        index: 2,
        routes: [
          { name: 'GrammarLesson', params: { topicId: 'topic-1', lessonId: 'lesson-1' } },
          { name: 'GrammarPractice', params: { topicId: 'topic-1', lessonId: 'lesson-1' } },
          { name: 'GrammarReview' },
        ],
      }),
      getParent: () => ({
        getState: () => ({
          routes: [
            { name: 'GrammarHome' },
            { name: 'GrammarLesson', params: { topicId: 'topic-1', lessonId: 'lesson-1' } },
            { name: 'GrammarPracticeFlow' },
          ],
        }),
        dispatch: mockDispatchNav,
      }),
      addListener: (_event: string, handler: typeof beforeRemoveHandler) => {
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

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

jest.mock('@/features/grammar/hooks', () => {
  const actual = jest.requireActual(
    '@/features/grammar/hooks',
  ) as typeof import('@/features/grammar/hooks');
  return {
    ...actual,
    useGrammarTopic: jest.fn(),
    useGrammarLesson: jest.fn(),
    useGrammarExercises: jest.fn(),
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

const hooks = jest.requireMock('@/features/grammar/hooks') as {
  useGrammarTopic: jest.Mock;
  useGrammarLesson: jest.Mock;
  useGrammarExercises: jest.Mock;
};
const session = jest.requireMock('@/features/grammar/session') as {
  usePracticeSession: jest.Mock;
};

function textOf(node: { props: { children?: unknown } }): string {
  const value = node.props.children;
  if (Array.isArray(value)) {
    return value.map((item) => (item == null ? '' : String(item))).join('');
  }
  return value == null ? '' : String(value);
}

describe('grammar practice interactions', () => {
  const mc = FIXTURE_MC;
  const fill = FIXTURE_FILL;
  const order = FIXTURE_ORDER;

  beforeEach(() => {
    jest.clearAllMocks();
    beforeRemoveHandler = null;
    hooks.useGrammarTopic.mockReturnValue({
      isLoading: false,
      isError: false,
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
      },
      refetch: jest.fn(),
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
  });

  it('maps all exercise types and formats correct answers', () => {
    expect(
      mapPublishedExercise(
        {
          id: '1',
          exerciseKey: mc.id,
          topicId: 't',
          lessonId: 'l',
          type: 'multiple_choice',
          prompt: mc.prompt,
          explanation: mc.explanation,
          sortOrder: 1,
          contentSchemaVersion: 1,
          payload: mc.payload,
          answer: mc.answer,
        },
        'present-simple',
        'core',
      ).type,
    ).toBe('multiple_choice');
    expect(
      mapPublishedExercise(
        {
          id: '2',
          exerciseKey: fill.id,
          topicId: 't',
          lessonId: 'l',
          type: 'fill_blank',
          prompt: fill.prompt,
          explanation: fill.explanation,
          sortOrder: 1,
          contentSchemaVersion: 1,
          payload: fill.payload,
          answer: fill.answer,
        },
        'present-simple',
        'core',
      ).type,
    ).toBe('fill_blank');
    expect(
      mapPublishedExercise(
        {
          id: '3',
          exerciseKey: order.id,
          topicId: 't',
          lessonId: 'l',
          type: 'sentence_order',
          prompt: order.prompt,
          explanation: order.explanation,
          sortOrder: 1,
          contentSchemaVersion: 1,
          payload: order.payload,
          answer: order.answer,
        },
        'present-simple',
        'core',
      ).type,
    ).toBe('sentence_order');

    expect(formatCorrectAnswer(mc).length).toBeGreaterThan(0);
    expect(formatCorrectAnswer(fill).length).toBeGreaterThan(0);
    expect(formatCorrectAnswer(order).length).toBeGreaterThan(0);
    expect(createClientAttemptId().length).toBeGreaterThan(4);
  });

  it('checks MC answer and navigates to review on last continue', async () => {
    const dispatch = jest.fn();
    const commitCompletedSession = jest.fn();

    let phase: 'answering' | 'checked' = 'answering';
    let response: { type: 'multiple_choice'; optionId: string } | null = {
      type: 'multiple_choice',
      optionId: mc.answer.optionId,
    };
    const answered = {
      exerciseId: mc.id,
      correct: true,
      selectedIds: [mc.answer.optionId],
      skipped: false as const,
    };

    session.usePracticeSession.mockImplementation(() => ({
      state: {
        exercises: [mc],
        index: 0,
        phase,
        response,
        lastCorrect: phase === 'checked' ? true : null,
        lastExplanation: phase === 'checked' ? mc.explanation : null,
        checked: phase === 'checked' ? [answered] : [],
        correctCount: phase === 'checked' ? 1 : 0,
        clientAttemptId: 'attempt-42',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch: (action: { type: string }) => {
        dispatch(action);
        if (action.type === 'check') {
          phase = 'checked';
        }
      },
      applyAction: jest.fn((action: { type: string }) => {
        dispatch(action as never);
        return { phase: action.type === 'submit' ? 'completed' : 'reviewing' } as never;
      }),
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession,
      getCompletedSession: jest.fn(),
    }));

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarPracticeScreen />);
    });

    const action = root.root.findByProps({ testID: 'grammar-practice-action' });
    await act(() => {
      action.props.onPress();
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'check' });

    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    expect(root.root.findAllByType(Text).some((node) => textOf(node).includes('Correct'))).toBe(
      true,
    );
    expect(
      root.root.findAllByType(Text).some((node) => textOf(node).includes('Review answers')),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'grammar-practice-action' }).props.onPress();
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'continue' });
    expect(commitCompletedSession).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('GrammarReview');
    expect(mockReplace).not.toHaveBeenCalled();

    expect(practiceReducer).toEqual(expect.any(Function));
  });

  it('renders fill/order controls and intercepts leave while active', async () => {
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [fill],
        index: 0,
        phase: 'answering',
        response: { type: 'fill_blank', text: 'x' },
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'a',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch: jest.fn(),
      applyAction: jest.fn((_action) => ({ phase: 'reviewing' })),
      startSession: jest.fn(),
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
          id: fill.id,
          exerciseKey: fill.id,
          topicId: 'topic-1',
          lessonId: 'lesson-1',
          type: fill.type,
          prompt: fill.prompt,
          explanation: fill.explanation,
          sortOrder: 1,
          contentSchemaVersion: 1,
          payload: fill.payload,
          answer: fill.answer,
        },
      ],
      refetch: jest.fn(),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarPracticeScreen />);
    });
    expect(root.root.findByProps({ testID: 'grammar-exercise-fill' })).toBeTruthy();

    const preventDefault = jest.fn();
    await act(() => {
      beforeRemoveHandler?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });
    expect(preventDefault).toHaveBeenCalled();
    expect(root.root.findByProps({ testID: 'confirm-modal-confirm' })).toBeTruthy();
    await act(() => {
      root.root.findByProps({ testID: 'confirm-modal-cancel' }).props.onPress();
    });

    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [order],
        index: 0,
        phase: 'answering',
        response: { type: 'sentence_order', tokenIds: [order.payload.tokens[0].id] },
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'a',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch: jest.fn(),
      applyAction: jest.fn((_action) => ({ phase: 'reviewing' })),
      startSession: jest.fn(),
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
          id: order.id,
          exerciseKey: order.id,
          topicId: 'topic-1',
          lessonId: 'lesson-1',
          type: order.type,
          prompt: order.prompt,
          explanation: order.explanation,
          sortOrder: 1,
          contentSchemaVersion: 1,
          payload: order.payload,
          answer: order.answer,
        },
      ],
      refetch: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    expect(root.root.findByProps({ testID: 'grammar-exercise-order' })).toBeTruthy();
  });

  it('continues to next question, leave confirm clears, and incorrect feedback', async () => {
    const clearActiveSession = jest.fn();
    const dispatch = jest.fn();
    let phase: 'answering' | 'checked' = 'checked';
    const second = FIXTURE_MC_SECOND;

    session.usePracticeSession.mockImplementation(() => ({
      state: {
        exercises: [mc, second],
        index: 0,
        phase,
        response: { type: 'multiple_choice', optionId: 'wrong' },
        lastCorrect: false,
        lastExplanation: mc.explanation,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'a',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch,
      applyAction: jest.fn((action: { type: string }) => {
        dispatch(action as never);
        return { phase: action.type === 'submit' ? 'completed' : 'reviewing' } as never;
      }),
      startSession: jest.fn(),
      clearActiveSession,
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    }));

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarPracticeScreen />);
    });
    expect(root.root.findAllByType(Text).some((node) => textOf(node).includes('Incorrect'))).toBe(
      true,
    );
    await act(() => {
      root.root.findByProps({ testID: 'grammar-practice-action' }).props.onPress();
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'continue' });
    expect(mockReplace).not.toHaveBeenCalled();

    const preventDefault = jest.fn();
    await act(() => {
      beforeRemoveHandler?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });
    await act(() => {
      root.root.findByProps({ testID: 'confirm-modal-confirm' }).props.onPress();
    });
    expect(clearActiveSession).toHaveBeenCalled();
    expect(mockDispatchNav).toHaveBeenCalledWith({ type: 'GO_BACK' });

    // Confirmed leave must not re-trap on the follow-up beforeRemove.
    const preventDefaultAgain = jest.fn();
    await act(() => {
      beforeRemoveHandler?.({
        preventDefault: preventDefaultAgain,
        data: { action: { type: 'GO_BACK' } },
      });
    });
    expect(preventDefaultAgain).not.toHaveBeenCalled();

    // empty fill cannot check
    phase = 'answering';
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [fill],
        index: 0,
        phase: 'answering',
        response: { type: 'fill_blank', text: '   ' },
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'a',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch,
      applyAction: jest.fn((action: { type: string }) => {
        dispatch(action as never);
        return { phase: 'reviewing' } as never;
      }),
      startSession: jest.fn(),
      clearActiveSession,
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    hooks.useGrammarExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: fill.id,
          exerciseKey: fill.id,
          topicId: 'topic-1',
          lessonId: 'lesson-1',
          type: fill.type,
          prompt: fill.prompt,
          explanation: fill.explanation,
          sortOrder: 1,
          contentSchemaVersion: 1,
          payload: fill.payload,
          answer: fill.answer,
        },
      ],
      refetch: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    expect(root.root.findByProps({ testID: 'grammar-practice-action' }).props.disabled).toBe(true);

    // Partial sentence-order cannot check.
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [order],
        index: 0,
        phase: 'answering',
        response: {
          type: 'sentence_order',
          tokenIds: order.answer.tokenIds.slice(0, 1),
        },
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'a',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch,
      applyAction: jest.fn((action: { type: string }) => {
        dispatch(action as never);
        return { phase: 'reviewing' } as never;
      }),
      startSession: jest.fn(),
      clearActiveSession,
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    hooks.useGrammarExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: order.id,
          exerciseKey: order.id,
          topicId: 'topic-1',
          lessonId: 'lesson-1',
          type: order.type,
          prompt: order.prompt,
          explanation: order.explanation,
          sortOrder: 1,
          contentSchemaVersion: 1,
          payload: order.payload,
          answer: order.answer,
        },
      ],
      refetch: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    expect(root.root.findByProps({ testID: 'grammar-practice-action' }).props.disabled).toBe(true);
  });

  it('renders selected, correct, and incorrect MC option states', async () => {
    const onSelect = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <MultipleChoiceExerciseView
          exercise={mc}
          selectedOptionId={mc.payload.options[1]?.id ?? null}
          checked={false}
          onSelect={onSelect}
        />,
      );
    });
    await act(() => {
      root.update(
        <MultipleChoiceExerciseView
          exercise={mc}
          selectedOptionId={mc.payload.options[1]?.id ?? null}
          checked
          onSelect={onSelect}
        />,
      );
    });
    expect(root.root.findByProps({ testID: 'grammar-exercise-mc' })).toBeTruthy();
  });

  it('renders MC/fill views and mounts navigator shell', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <MultipleChoiceExerciseView
          exercise={mc}
          selectedOptionId={mc.answer.optionId}
          checked
          onSelect={() => undefined}
        />,
      );
    });
    expect(root.root.findByProps({ testID: 'grammar-exercise-mc' })).toBeTruthy();

    await act(() => {
      root.update(
        <FillBlankExerciseView
          exercise={fill}
          value="hi"
          checked={false}
          onChange={() => undefined}
        />,
      );
    });
    const fillInput = root.root.findByProps({ testID: 'grammar-exercise-fill' });
    expect(fillInput).toBeTruthy();
    expect(fillInput.props.placeholder).toBe('Type the negative form of "do"');
    expect(fillInput.props.placeholder).not.toContain('___');

    await act(() => {
      root.update(<GrammarNavigator />);
    });
    act(() => {
      root.unmount();
    });
  });

  it('reviews Done/Skipped rows, reopens skipped, and submits to result', async () => {
    const dispatch = jest.fn();
    const commitCompletedSession = jest.fn(() => ({
      clientAttemptId: 'attempt-42',
      topicId: 'topic-1',
      lessonId: 'lesson-1',
      contentRevision: 1,
      correctCount: 1,
      totalCount: 2,
      score: 50,
      completed: false,
      answers: [],
      startedAt: 'x',
      completedAt: 'y',
    }));
    const completedSnapshot = {
      phase: 'completed' as const,
      score: 50,
      completed: false,
      clientAttemptId: 'attempt-42',
      topicId: 'topic-1',
      lessonId: 'lesson-1',
      contentRevision: 1,
      correctCount: 1,
      exercises: [mc, fill],
      checked: [
        {
          exerciseId: mc.id,
          correct: true,
          selectedIds: [mc.answer.optionId],
          skipped: false,
        },
        {
          exerciseId: fill.id,
          correct: false,
          selectedIds: [],
          skipped: true,
        },
      ],
      startedAt: 'x',
      completedAt: 'y',
      index: 1,
      response: null,
      lastCorrect: null,
      lastExplanation: null,
      resumeReviewOnBack: false,
      reopenedPrior: null,
    };

    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc, fill],
        index: 1,
        phase: 'reviewing',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [
          {
            exerciseId: mc.id,
            correct: true,
            selectedIds: [mc.answer.optionId],
            skipped: false,
          },
          {
            exerciseId: fill.id,
            correct: false,
            selectedIds: [],
            skipped: true,
          },
        ],
        correctCount: 1,
        clientAttemptId: 'attempt-42',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch,
      applyAction: jest.fn((action: { type: string }) => {
        dispatch(action as never);
        if (action.type === 'reopen') {
          return { phase: 'answering' } as never;
        }
        if (action.type === 'submit') {
          return completedSnapshot as never;
        }
        return { phase: 'reviewing' } as never;
      }),
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession,
      getCompletedSession: jest.fn(),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarReviewScreen />);
    });

    expect(root.root.findByProps({ testID: 'grammar-review' })).toBeTruthy();
    expect(root.root.findAllByType(Text).some((node) => textOf(node).includes('1 answered'))).toBe(
      true,
    );
    expect(root.root.findAllByType(Text).some((node) => textOf(node).includes('Skipped'))).toBe(
      true,
    );

    await act(() => {
      root.root.findByProps({ testID: 'grammar-review-row-1' }).props.onPress();
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'reopen', index: 1 });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarPractice', {
      topicId: 'topic-1',
      lessonId: 'lesson-1',
    });

    await act(() => {
      root.root.findByProps({ testID: 'grammar-review-submit' }).props.onPress();
    });
    expect(dispatch).toHaveBeenCalledWith({ type: 'submit' });
    expect(commitCompletedSession).toHaveBeenCalledWith(completedSnapshot);
    expect(mockDispatchNav).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RESET',
        payload: expect.objectContaining({
          index: 0,
          routes: [
            expect.objectContaining({
              name: 'GrammarResult',
              params: { clientAttemptId: 'attempt-42' },
            }),
          ],
        }),
      }),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('leaves review via back without reopening a question', async () => {
    const dispatch = jest.fn();
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc, fill],
        index: 1,
        phase: 'reviewing',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [
          {
            exerciseId: mc.id,
            correct: true,
            selectedIds: [mc.answer.optionId],
            skipped: false,
          },
          {
            exerciseId: fill.id,
            correct: false,
            selectedIds: [],
            skipped: true,
          },
        ],
        correctCount: 1,
        clientAttemptId: 'attempt-42',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch,
      applyAction: jest.fn((action: { type: string }) => {
        dispatch(action as never);
        return { phase: action.type === 'submit' ? 'completed' : 'reviewing' } as never;
      }),
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarReviewScreen />);
    });

    const header = root.root.findByProps({ title: 'Review answers' });
    await act(() => {
      header.props.onBackPress();
    });
    expect(dispatch).not.toHaveBeenCalled();
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows loading/error/empty states and review state CTA', async () => {
    const refetchTopic = jest.fn(async () => undefined);
    const refetchLesson = jest.fn(async () => undefined);
    const refetchExercises = jest.fn(async () => undefined);

    hooks.useGrammarTopic.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: refetchTopic,
    });
    hooks.useGrammarLesson.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: refetchLesson,
    });
    hooks.useGrammarExercises.mockReturnValue({
      isLoading: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      refetch: refetchExercises,
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
        clientAttemptId: 'attempt-1',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch: jest.fn(),
      applyAction: jest.fn(() => ({ phase: 'answering' })),
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarPracticeScreen />);
    });
    expect(root.root.findByProps({ testID: 'grammar-practice-loading' })).toBeTruthy();

    hooks.useGrammarTopic.mockReturnValue({
      isLoading: false,
      isError: true,
      error: new Error('down'),
      data: undefined,
      refetch: refetchTopic,
    });
    hooks.useGrammarLesson.mockReturnValue({
      isLoading: false,
      isError: true,
      error: new Error('down'),
      data: undefined,
      refetch: refetchLesson,
    });
    hooks.useGrammarExercises.mockReturnValue({
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: new Error('down'),
      data: undefined,
      refetch: refetchExercises,
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-practice-retry' }).props.onPress();
    });
    expect(refetchTopic).toHaveBeenCalled();
    expect(refetchLesson).toHaveBeenCalled();
    expect(refetchExercises).toHaveBeenCalled();

    hooks.useGrammarTopic.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { id: 'topic-1', slug: 'present-simple' },
      refetch: refetchTopic,
    });
    hooks.useGrammarLesson.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { id: 'lesson-1', slug: 'a2', contentRevision: 1 },
      refetch: refetchLesson,
    });
    hooks.useGrammarExercises.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [],
      refetch: refetchExercises,
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => textOf(node).includes('no published exercises yet')),
    ).toBe(true);

    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc],
        index: 0,
        phase: 'reviewing',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [{ exerciseId: mc.id, correct: true, selectedIds: [mc.answer.optionId] }],
        correctCount: 1,
        clientAttemptId: 'attempt-1',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
      },
      dispatch: jest.fn(),
      applyAction: jest.fn(() => ({ phase: 'reviewing' })),
      startSession: jest.fn(),
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
          sortOrder: 1,
          contentSchemaVersion: 1,
          payload: mc.payload,
          answer: mc.answer,
        },
      ],
      refetch: refetchExercises,
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-practice-open-review' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarReview');
  });

  it('covers primary-action guards and beforeRemove branches', async () => {
    const dispatch = jest.fn();
    const applyAction = jest.fn();
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc],
        index: 0,
        phase: 'answering',
        response: { type: 'fill_blank', text: '   ' },
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'attempt-1',
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
      dispatch,
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
      root.root.findByProps({ testID: 'grammar-practice-action' }).props.onPress();
    });
    expect(dispatch).not.toHaveBeenCalled();

    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc],
        index: 0,
        phase: 'checked',
        response: null,
        lastCorrect: true,
        lastExplanation: 'ok',
        checked: [{ exerciseId: mc.id, correct: true, selectedIds: [mc.answer.optionId] }],
        correctCount: 1,
        clientAttemptId: 'attempt-1',
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
      dispatch,
      applyAction: jest.fn(() => ({ phase: 'reviewing' })),
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-practice-action' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarReview');

    const preventDefault = jest.fn();
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc],
        index: 0,
        phase: 'completed',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'attempt-1',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: 'y',
        score: 80,
        completed: true,
        resumeReviewOnBack: false,
        reopenedPrior: null,
      },
      dispatch,
      applyAction: jest.fn(),
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    await act(() => {
      beforeRemoveHandler?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });
    expect(preventDefault).not.toHaveBeenCalled();

    const applyBack = jest
      .fn()
      .mockReturnValueOnce({ phase: 'answering' })
      .mockReturnValueOnce({ phase: 'reviewing' });
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc],
        index: 0,
        phase: 'answering',
        response: null,
        lastCorrect: null,
        lastExplanation: null,
        checked: [{ exerciseId: mc.id, correct: false, selectedIds: [] }],
        correctCount: 0,
        clientAttemptId: 'attempt-1',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
        resumeReviewOnBack: true,
        reopenedPrior: null,
      },
      dispatch,
      applyAction: applyBack,
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    await act(() => {
      beforeRemoveHandler?.({
        preventDefault,
        data: { action: { type: 'POP' } },
      });
    });
    await act(() => {
      beforeRemoveHandler?.({
        preventDefault,
        data: { action: { type: 'POP' } },
      });
    });
    expect(applyBack).toHaveBeenCalledWith({ type: 'back' });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarReview');
  });

  it('covers canCheck branches for sentence-order and header/progress back guards', async () => {
    const applyAction = jest.fn(() => ({ phase: 'answering' }));
    const dispatch = jest.fn();
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc],
        index: 0,
        phase: 'answering',
        response: { type: 'sentence_order', tokenIds: ['a'] },
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'attempt-1',
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
      dispatch,
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
    expect(root.root.findByProps({ testID: 'grammar-practice-action' }).props.disabled).toBe(true);

    const header = root.root.findByProps({ title: 'Practice' });
    await act(() => {
      header.props.onBackPress();
    });
    expect(mockGoBack).toHaveBeenCalled();

    await act(() => {
      root.root.findByProps({ testID: 'grammar-practice-back' }).props.onPress();
    });
    expect(applyAction).not.toHaveBeenCalledWith({ type: 'back' });

    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [order],
        index: 0,
        phase: 'answering',
        response: {
          type: 'sentence_order',
          tokenIds: order.answer.tokenIds.slice(),
        },
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'attempt-1',
        topicId: 'topic-1',
        lessonId: 'lesson-1',
        contentRevision: 1,
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
        resumeReviewOnBack: true,
        reopenedPrior: null,
      },
      dispatch,
      applyAction: jest.fn(() => ({ phase: 'reviewing' })),
      startSession: jest.fn(),
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
          id: order.id,
          exerciseKey: order.id,
          topicId: 'topic-1',
          lessonId: 'lesson-1',
          type: order.type,
          prompt: order.prompt,
          explanation: order.explanation,
          sortOrder: order.sortOrder,
          contentSchemaVersion: 1,
          payload: order.payload,
          answer: order.answer,
        },
      ],
      refetch: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    expect(root.root.findByProps({ testID: 'grammar-practice-action' }).props.disabled).toBe(false);
    await act(() => {
      root.root.findByProps({ title: 'Practice' }).props.onBackPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarReview');
  });

  it('invokes exercise onChange callbacks and skip/back guards', async () => {
    const dispatch = jest.fn();
    const applyAction = jest.fn(() => ({ phase: 'answering' }));
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
        startedAt: 'x',
        completedAt: null,
        score: null,
        completed: null,
        resumeReviewOnBack: false,
        reopenedPrior: null,
      },
      dispatch,
      applyAction,
      startSession: jest.fn(),
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
    await act(() => {
      const mcView = root.root.findByProps({ testID: 'grammar-exercise-mc' });
      const pressable = mcView.findAllByProps({ accessibilityRole: 'button' })[0];
      pressable?.props.onPress?.();
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'set_response',
        response: expect.objectContaining({ type: 'multiple_choice' }),
      }),
    );

    // double primary hits action lock early-return
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc],
        index: 0,
        phase: 'answering',
        response: { type: 'multiple_choice', optionId: mc.answer.optionId },
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'attempt-1',
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
      dispatch,
      applyAction,
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    await act(() => {
      const action = root.root.findByProps({ testID: 'grammar-practice-action' });
      action.props.onPress();
      action.props.onPress();
    });

    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [fill],
        index: 0,
        phase: 'answering',
        response: { type: 'fill_blank', text: '' },
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'attempt-1',
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
      dispatch,
      applyAction,
      startSession: jest.fn(),
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
          id: fill.id,
          exerciseKey: fill.id,
          topicId: 'topic-1',
          lessonId: 'lesson-1',
          type: fill.type,
          prompt: fill.prompt,
          explanation: fill.explanation,
          sortOrder: fill.sortOrder,
          contentSchemaVersion: 1,
          payload: fill.payload,
          answer: fill.answer,
        },
      ],
      refetch: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-exercise-fill' }).props.onChangeText('ships');
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'set_response',
      response: { type: 'fill_blank', text: 'ships' },
    });

    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [order],
        index: 0,
        phase: 'answering',
        response: { type: 'sentence_order', tokenIds: [] },
        lastCorrect: null,
        lastExplanation: null,
        checked: [],
        correctCount: 0,
        clientAttemptId: 'attempt-1',
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
      dispatch,
      applyAction,
      startSession: jest.fn(),
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
          id: order.id,
          exerciseKey: order.id,
          topicId: 'topic-1',
          lessonId: 'lesson-1',
          type: order.type,
          prompt: order.prompt,
          explanation: order.explanation,
          sortOrder: order.sortOrder,
          contentSchemaVersion: 1,
          payload: order.payload,
          answer: order.answer,
        },
      ],
      refetch: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    await act(() => {
      const tokenLabel = order.payload.tokens[0]!.text;
      root.root.findByProps({ accessibilityLabel: `Add ${tokenLabel}` }).props.onPress();
    });

    // skip ignored outside answering; progress back ignored when cannot
    session.usePracticeSession.mockReturnValue({
      state: {
        exercises: [mc],
        index: 0,
        phase: 'checked',
        response: null,
        lastCorrect: true,
        lastExplanation: 'x',
        checked: [],
        correctCount: 0,
        clientAttemptId: 'attempt-1',
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
      dispatch,
      applyAction,
      startSession: jest.fn(),
      clearActiveSession: jest.fn(),
      commitCompletedSession: jest.fn(),
      getCompletedSession: jest.fn(),
    });
    await act(() => {
      root.update(<GrammarPracticeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-practice-skip' }).props.onPress();
      root.root.findByProps({ testID: 'grammar-practice-back' }).props.onPress();
    });
  });
});
