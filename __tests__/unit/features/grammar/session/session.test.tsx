import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  PracticeSessionProvider,
  createClientAttemptId,
  mapPublishedExercise,
  usePracticeSession,
} from '@/features/grammar/session';
import {
  buildCompletedSession,
  createInitialPracticeState,
  practiceReducer,
} from '@/features/grammar/utils';

import { FIXTURE_MC } from '../../../../helpers/grammarFixtures';

describe('grammar practice session', () => {
  it('creates attempt ids and maps published exercises', () => {
    expect(createClientAttemptId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });
    expect(createClientAttemptId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });

    const mapped = mapPublishedExercise(
      {
        id: 'uuid-1',
        exerciseKey: 'ps-x1',
        topicId: 't1',
        lessonId: 'l1',
        type: 'multiple_choice',
        prompt: 'Choose',
        explanation: 'Because',
        sortOrder: 1,
        contentSchemaVersion: 1,
        payload: {
          options: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ],
        },
        answer: { optionId: 'a' },
      },
      'present-simple',
      'core',
    );
    expect(mapped).toMatchObject({ id: 'uuid-1', type: 'multiple_choice' });
  });

  it('stores immutable completed sessions by clientAttemptId', async () => {
    const mc = FIXTURE_MC;
    let api!: ReturnType<typeof usePracticeSession>;
    function Probe() {
      api = usePracticeSession();
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <PracticeSessionProvider>
          <Probe />
        </PracticeSessionProvider>,
      );
    });

    await act(() => {
      api.startSession({
        exercises: [mc],
        topicId: 't1',
        lessonId: 'l1',
        contentRevision: 1,
      });
    });

    await act(() => {
      api.dispatch({
        type: 'set_response',
        response: { type: 'multiple_choice', optionId: mc.answer.optionId },
      });
      api.dispatch({ type: 'check' });
    });

    let reviewed!: ReturnType<typeof practiceReducer>;
    await act(() => {
      reviewed = api.applyAction({ type: 'continue' });
    });
    expect(reviewed.phase).toBe('reviewing');
    let session!: NonNullable<ReturnType<typeof buildCompletedSession>>;
    await act(() => {
      const completed = api.applyAction({ type: 'submit' });
      session = api.commitCompletedSession(completed)!;
    });

    expect(session.answers[0]).not.toHaveProperty('text');
    expect(api.getCompletedSession(session.clientAttemptId)?.score).toBe(100);
    expect(api.getCompletedSession('missing')).toBeNull();

    await act(() => {
      api.clearActiveSession();
    });
    expect(api.state.exercises).toHaveLength(0);
    expect(practiceReducer(createInitialPracticeState(), { type: 'reset' }).phase).toBe(
      'answering',
    );

    act(() => {
      root.unmount();
    });
  });

  it('submits after skipping every question without rewinding', async () => {
    const first = FIXTURE_MC;
    const second = { ...FIXTURE_MC, id: 'fixture-mc-2' };
    let api!: ReturnType<typeof usePracticeSession>;
    function Probe() {
      api = usePracticeSession();
      return null;
    }

    await act(() => {
      ReactTestRenderer.create(
        <PracticeSessionProvider>
          <Probe />
        </PracticeSessionProvider>,
      );
    });

    await act(() => {
      api.startSession({
        exercises: [first, second],
        topicId: 't1',
        lessonId: 'l1',
        contentRevision: 1,
      });
    });

    await act(() => {
      expect(api.applyAction({ type: 'skip' }).phase).toBe('answering');
      expect(api.applyAction({ type: 'skip' }).phase).toBe('reviewing');
    });
    expect(api.state.phase).toBe('reviewing');

    await act(() => {
      const completed = api.applyAction({ type: 'submit' });
      expect(completed.phase).toBe('completed');
      expect(api.commitCompletedSession(completed)?.totalCount).toBe(2);
    });
    expect(api.state.phase).toBe('completed');
  });

  it('starts once per lesson set and freezes duplicate commits', async () => {
    const mc = FIXTURE_MC;
    let api!: ReturnType<typeof usePracticeSession>;
    function Probe() {
      api = usePracticeSession();
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <PracticeSessionProvider>
          <Probe />
        </PracticeSessionProvider>,
      );
    });

    await act(() => {
      api.startSession({
        exercises: [mc],
        topicId: 't1',
        lessonId: 'l1',
        contentRevision: 1,
      });
    });
    const firstId = api.state.clientAttemptId;
    await act(() => {
      api.startSession({
        exercises: [mc],
        topicId: 't1',
        lessonId: 'l1',
        contentRevision: 1,
      });
    });
    expect(api.state.clientAttemptId).toBe(firstId);
    expect(api.commitCompletedSession()).toBeNull();

    await act(() => {
      api.dispatch({
        type: 'set_response',
        response: { type: 'multiple_choice', optionId: mc.answer.optionId },
      });
      api.dispatch({ type: 'check' });
    });
    let first!: ReturnType<typeof api.commitCompletedSession>;
    let second!: ReturnType<typeof api.commitCompletedSession>;
    await act(() => {
      api.applyAction({ type: 'continue' });
      const completed = api.applyAction({ type: 'submit' });
      first = api.commitCompletedSession(completed);
      second = api.commitCompletedSession(completed);
    });
    expect(second?.clientAttemptId).toBe(first?.clientAttemptId);

    // Completed phase must not restart when the same lesson set remounts/refetches.
    const completedId = api.state.clientAttemptId;
    await act(() => {
      api.startSession({
        exercises: [mc],
        topicId: 't1',
        lessonId: 'l1',
        contentRevision: 1,
      });
    });
    expect(api.state.phase).toBe('completed');
    expect(api.state.clientAttemptId).toBe(completedId);

    act(() => {
      root.unmount();
    });
  });

  it('keeps stateRef in sync across rapid dispatch then applyAction', async () => {
    const mc = FIXTURE_MC;
    let api!: ReturnType<typeof usePracticeSession>;
    function Probe() {
      api = usePracticeSession();
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <PracticeSessionProvider>
          <Probe />
        </PracticeSessionProvider>,
      );
    });

    await act(() => {
      api.startSession({
        exercises: [mc, { ...mc, id: 'mc-2' }],
        topicId: 't1',
        lessonId: 'l1',
        contentRevision: 1,
      });
    });

    let afterBack!: ReturnType<typeof api.applyAction>;
    await act(() => {
      api.dispatch({
        type: 'set_response',
        response: { type: 'multiple_choice', optionId: mc.answer.optionId },
      });
      api.dispatch({ type: 'check' });
      afterBack = api.applyAction({ type: 'back' });
    });
    expect(afterBack.phase).toBe('answering');
    expect(api.state.phase).toBe('answering');
    expect(api.state.checked).toHaveLength(0);

    act(() => {
      root.unmount();
    });
  });

  it('requires a practice session provider', () => {
    function Probe() {
      usePracticeSession();
      return null;
    }
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => {
      act(() => {
        ReactTestRenderer.create(<Probe />);
      });
    }).toThrow(/PracticeSessionProvider/);
    consoleSpy.mockRestore();
  });
});
