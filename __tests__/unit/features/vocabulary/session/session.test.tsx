import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  PracticeSessionProvider,
  createClientAttemptId,
  usePracticeSession,
} from '@/features/vocabulary/session';
import {
  buildCompletedSession,
  createInitialPracticeState,
  practiceReducer,
} from '@/features/vocabulary/utils';

import { FIXTURE_CHOOSE } from '../../../../helpers/vocabularyFixtures';

describe('vocabulary practice session', () => {
  it('creates attempt ids', () => {
    expect(createClientAttemptId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('stores immutable completed sessions by clientAttemptId', async () => {
    const mc = FIXTURE_CHOOSE;
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
        situationId: 'task-progress',
        situationSlug: 'task-progress',
        contentRevision: 1,
      });
    });

    await act(() => {
      api.dispatch({
        type: 'set_response',
        response: { type: 'choose_expression', optionId: mc.answer.optionId },
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

  it('starts once per situation set and freezes duplicate commits', async () => {
    const mc = FIXTURE_CHOOSE;
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
        situationId: 'task-progress',
        situationSlug: 'task-progress',
        contentRevision: 1,
      });
    });
    const firstId = api.state.clientAttemptId;
    await act(() => {
      api.startSession({
        exercises: [mc],
        situationId: 'task-progress',
        situationSlug: 'task-progress',
        contentRevision: 1,
      });
    });
    expect(api.state.clientAttemptId).toBe(firstId);
    expect(api.commitCompletedSession()).toBeNull();

    await act(() => {
      api.dispatch({
        type: 'set_response',
        response: { type: 'choose_expression', optionId: mc.answer.optionId },
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

    const completedId = api.state.clientAttemptId;
    await act(() => {
      api.startSession({
        exercises: [mc],
        situationId: 'task-progress',
        situationSlug: 'task-progress',
        contentRevision: 1,
      });
    });
    expect(api.state.phase).toBe('completed');
    expect(api.state.clientAttemptId).toBe(completedId);

    act(() => {
      root.unmount();
    });
  });

  it('exposes live getActiveState and blocks mid-flow restarts', async () => {
    const mc = FIXTURE_CHOOSE;
    const other = { ...FIXTURE_CHOOSE, id: 'other-choose', itemId: 'task-progress:other' };
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
        exercises: [mc],
        situationId: 'task-progress',
        situationSlug: 'task-progress',
        contentRevision: 1,
      });
    });
    expect(api.getActiveState().clientAttemptId).toBe(api.state.clientAttemptId);

    // Answering with zero checked must still refuse a different composition.
    const freshAttempt = api.state.clientAttemptId;
    await act(() => {
      api.startSession({
        exercises: [other],
        situationId: 'meetings',
        situationSlug: 'meetings',
        contentRevision: 1,
      });
    });
    expect(api.state.clientAttemptId).toBe(freshAttempt);
    expect(api.getActiveState().exercises[0]?.id).toBe(mc.id);

    await act(() => {
      api.dispatch({ type: 'skip' });
    });
    expect(api.getActiveState().checked).toHaveLength(1);

    const attemptId = api.state.clientAttemptId;
    await act(() => {
      api.startSession({
        exercises: [other],
        situationId: 'task-progress',
        situationSlug: 'task-progress',
        contentRevision: 1,
      });
    });
    expect(api.state.clientAttemptId).toBe(attemptId);
    expect(api.getActiveState().checked).toHaveLength(1);

    await act(() => {
      api.applyAction({ type: 'submit' });
    });
    expect(api.getActiveState().phase).toBe('completed');
    // Same composition key stays completed until clearActiveSession.
    await act(() => {
      api.startSession({
        exercises: [mc],
        situationId: 'task-progress',
        situationSlug: 'task-progress',
        contentRevision: 1,
      });
    });
    expect(api.getActiveState().phase).toBe('completed');
    expect(api.getActiveState().clientAttemptId).toBe(attemptId);

    // Different situation/weak entry may start after a completed attempt without clear.
    await act(() => {
      api.startSession({
        exercises: [other],
        situationId: 'weak',
        situationSlug: 'weak',
        contentRevision: 1,
      });
    });
    expect(api.getActiveState().phase).toBe('answering');
    expect(api.getActiveState().situationSlug).toBe('weak');
    expect(api.getActiveState().clientAttemptId).not.toBe(attemptId);

    await act(() => {
      api.clearActiveSession();
      api.startSession({
        exercises: [mc, other],
        situationId: 'task-progress',
        situationSlug: 'task-progress',
        contentRevision: 1,
      });
      api.dispatch({
        type: 'set_response',
        response: { type: 'choose_expression', optionId: mc.answer.optionId },
      });
      api.dispatch({ type: 'check' });
    });
    expect(api.getActiveState().phase).toBe('checked');
    const checkedId = api.state.clientAttemptId;
    await act(() => {
      api.startSession({
        exercises: [mc],
        situationId: 'meetings',
        situationSlug: 'meetings',
        contentRevision: 1,
      });
    });
    expect(api.state.clientAttemptId).toBe(checkedId);

    await act(() => {
      api.applyAction({ type: 'continue' });
      api.dispatch({ type: 'skip' });
    });
    expect(api.getActiveState().phase).toBe('reviewing');
    await act(() => {
      api.startSession({
        exercises: [mc],
        situationId: 'bugs-problems',
        situationSlug: 'bugs-problems',
        contentRevision: 1,
      });
    });
    expect(api.getActiveState().phase).toBe('reviewing');
  });
});
