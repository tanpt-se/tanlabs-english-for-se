import {
  buildCompletedSession,
  createInitialPracticeState,
  isCompletedScore,
  isSkippedAnswer,
  monotonicBestScore,
  practiceReducer,
  scorePercent,
} from '@/features/grammar/utils/practiceReducer';

import { FIXTURE_EXERCISES, FIXTURE_MC } from '../../../../helpers/grammarFixtures';

function startState() {
  return practiceReducer(createInitialPracticeState(), {
    type: 'start',
    exercises: FIXTURE_EXERCISES,
    clientAttemptId: 'attempt-1',
    topicId: 'topic-1',
    lessonId: 'lesson-1',
    contentRevision: 1,
    startedAt: '2026-08-12T00:00:00Z',
  });
}

describe('practiceReducer branches', () => {
  it('covers scoring helpers', () => {
    expect(scorePercent(0, 0)).toBe(0);
    expect(scorePercent(7, 10)).toBe(70);
    expect(isCompletedScore(69)).toBe(false);
    expect(isCompletedScore(70)).toBe(true);
    expect(monotonicBestScore(null, 55)).toBe(55);
    expect(monotonicBestScore(88, 55)).toBe(88);
    expect(isSkippedAnswer(undefined)).toBe(false);
    expect(isSkippedAnswer({ exerciseId: 'x', correct: false, skipped: true })).toBe(true);
  });

  it('guards invalid actions and handles skip → review → submit', () => {
    let state = createInitialPracticeState();
    expect(
      practiceReducer(state, {
        type: 'start',
        exercises: [],
        clientAttemptId: 'x',
        topicId: 't',
        lessonId: 'l',
        contentRevision: 1,
        startedAt: '2026-08-12T00:00:00Z',
      }),
    ).toBe(state);

    state = startState();
    expect(practiceReducer(state, { type: 'check' })).toBe(state);

    state = practiceReducer(state, { type: 'skip' });
    expect(state.phase).toBe('answering');

    state = practiceReducer(state, { type: 'skip' });
    state = practiceReducer(state, { type: 'skip' });
    state = practiceReducer(state, { type: 'skip' });
    expect(state.phase).toBe('reviewing');
    expect(state.checked).toHaveLength(4);

    const reviewing = state;
    expect(
      practiceReducer(reviewing, {
        type: 'set_response',
        response: { type: 'fill_blank', text: 'x' },
      }),
    ).toBe(reviewing);

    const blockedSubmit = practiceReducer(
      { ...reviewing, checked: reviewing.checked.slice(0, 3) },
      { type: 'submit' },
    );
    expect(blockedSubmit.phase).toBe('reviewing');

    const completed = practiceReducer(reviewing, { type: 'submit' });
    expect(completed.phase).toBe('completed');
    expect(completed.score).toBe(0);
    expect(completed.completed).toBe(false);
  });

  it('supports reopen/back/retry/reset and completion session mapping', () => {
    let state = startState();
    state = practiceReducer(state, {
      type: 'set_response',
      response: { type: 'multiple_choice', optionId: FIXTURE_MC.answer.optionId },
    });
    state = practiceReducer(state, { type: 'check' });
    expect(state.phase).toBe('checked');

    const backToAnswering = practiceReducer(state, { type: 'back' });
    expect(backToAnswering.phase).toBe('answering');
    expect(backToAnswering.checked).toHaveLength(0);

    let review = startState();
    review = practiceReducer(review, { type: 'skip' });
    review = practiceReducer(review, { type: 'skip' });
    review = practiceReducer(review, { type: 'skip' });
    review = practiceReducer(review, { type: 'skip' });
    expect(review.phase).toBe('reviewing');

    const reopened = practiceReducer(review, { type: 'reopen', index: 1 });
    expect(reopened.phase).toBe('answering');
    expect(reopened.resumeReviewOnBack).toBe(true);
    expect(reopened.reopenedPrior?.exerciseId).toBe(FIXTURE_EXERCISES[1]?.id);

    const returnReview = practiceReducer(reopened, { type: 'back' });
    expect(returnReview.phase).toBe('reviewing');

    const completed = practiceReducer(review, { type: 'submit' });
    const reopenedFromCompleted = practiceReducer(completed, { type: 'return_to_review' });
    expect(reopenedFromCompleted.phase).toBe('reviewing');
    expect(reopenedFromCompleted.clientAttemptId).toBe(completed.clientAttemptId);

    const retry = practiceReducer(completed, {
      type: 'retry',
      clientAttemptId: 'attempt-2',
      startedAt: '2026-08-12T01:00:00Z',
    });
    expect(retry.phase).toBe('answering');
    expect(retry.clientAttemptId).toBe('attempt-2');

    const reset = practiceReducer(retry, { type: 'reset' });
    expect(reset).toEqual(createInitialPracticeState());

    const emptyRetry = practiceReducer(createInitialPracticeState(), {
      type: 'retry',
      clientAttemptId: 'attempt-3',
      startedAt: '2026-08-12T01:00:00Z',
    });
    expect(emptyRetry).toEqual(createInitialPracticeState());

    expect(buildCompletedSession(createInitialPracticeState())).toBeNull();
    const completedSession = buildCompletedSession(completed);
    expect(completedSession?.clientAttemptId).toBe('attempt-1');
    expect(completedSession?.totalCount).toBe(4);
  });

  it('handles defensive back/continue/reopen guards', () => {
    const base = startState();

    expect(
      practiceReducer({ ...base, exercises: [], phase: 'completed' }, { type: 'back' }),
    ).toEqual({
      ...base,
      exercises: [],
      phase: 'completed',
    });

    expect(practiceReducer({ ...base, phase: 'reviewing' }, { type: 'continue' })).toEqual({
      ...base,
      phase: 'reviewing',
    });

    expect(practiceReducer({ ...base, phase: 'answering' }, { type: 'reopen', index: 0 })).toEqual({
      ...base,
      phase: 'answering',
    });

    const reviewing = { ...base, phase: 'reviewing' as const };
    expect(practiceReducer(reviewing, { type: 'reopen', index: -1 })).toEqual(reviewing);
    expect(practiceReducer(reviewing, { type: 'reopen', index: 99 })).toEqual(reviewing);
  });

  it('keeps state when check has invalid payload and submit not reviewing', () => {
    const base = startState();
    const checkWithoutExercise = practiceReducer(
      { ...base, exercises: [], response: { type: 'multiple_choice', optionId: 'a' } },
      { type: 'check' },
    );
    expect(checkWithoutExercise.exercises).toEqual([]);

    const checkInvalidGrade = practiceReducer(
      { ...base, response: { type: 'multiple_choice', optionId: 'missing' } },
      { type: 'check' },
    );
    expect(checkInvalidGrade.phase).toBe('answering');

    const submitWrongPhase = practiceReducer(base, { type: 'submit' });
    expect(submitWrongPhase).toBe(base);
  });

  it('covers additional guard branches for back/continue/reopen/return', () => {
    const base = startState();

    // set_response ignored outside answering.
    expect(
      practiceReducer(
        { ...base, phase: 'checked' },
        { type: 'set_response', response: { type: 'fill_blank', text: 'x' } },
      ),
    ).toEqual({ ...base, phase: 'checked' });

    // skip ignored outside answering / missing exercise.
    expect(practiceReducer({ ...base, phase: 'checked' }, { type: 'skip' })).toEqual({
      ...base,
      phase: 'checked',
    });
    expect(practiceReducer({ ...base, exercises: [] }, { type: 'skip' })).toEqual({
      ...base,
      exercises: [],
    });

    // checked back guard when last/current mismatch.
    const mismatchBack = practiceReducer(
      {
        ...base,
        phase: 'checked',
        checked: [{ exerciseId: 'unknown', correct: true, selectedIds: ['a'] }],
        correctCount: 1,
      },
      { type: 'back' },
    );
    expect(mismatchBack.phase).toBe('checked');

    // checked back with resumeReviewOnBack restores prior.
    const reviewBack = practiceReducer(
      {
        ...base,
        phase: 'checked',
        index: 0,
        checked: [{ exerciseId: FIXTURE_EXERCISES[0]!.id, correct: true, selectedIds: ['a'] }],
        correctCount: 1,
        resumeReviewOnBack: true,
        reopenedPrior: {
          exerciseId: 'reopen-1',
          correct: false,
          skipped: true,
          selectedIds: [],
        },
      },
      { type: 'back' },
    );
    expect(reviewBack.phase).toBe('reviewing');

    // answering back guard when no checked.
    expect(
      practiceReducer(
        { ...base, phase: 'answering', checked: [], resumeReviewOnBack: false },
        { type: 'back' },
      ),
    ).toEqual({ ...base, phase: 'answering', checked: [], resumeReviewOnBack: false });

    // answering back guard when previous id not found in exercises.
    const missingPrevious = practiceReducer(
      {
        ...base,
        phase: 'answering',
        checked: [{ exerciseId: 'missing', correct: false, selectedIds: [] }],
      },
      { type: 'back' },
    );
    expect(missingPrevious.phase).toBe('answering');

    // continue from checked when already covered enters review.
    const coveredContinue = practiceReducer(
      {
        ...base,
        phase: 'checked',
        checked: base.exercises.map((exercise) => ({
          exerciseId: exercise.id,
          correct: false,
          selectedIds: [],
        })),
      },
      { type: 'continue' },
    );
    expect(coveredContinue.phase).toBe('reviewing');

    // reopen in reviewing when exercise lookup fails.
    const reopenMissingExercise = practiceReducer(
      { ...base, phase: 'reviewing', exercises: [] },
      { type: 'reopen', index: 0 },
    );
    expect(reopenMissingExercise.exercises).toEqual([]);

    // return_to_review ignored outside completed.
    expect(practiceReducer(base, { type: 'return_to_review' })).toBe(base);
  });

  it('covers scoring transitions for re-check/skip/reopen snapshots', () => {
    let state = startState();
    state = practiceReducer(state, {
      type: 'set_response',
      response: { type: 'multiple_choice', optionId: FIXTURE_MC.answer.optionId },
    });
    state = practiceReducer(state, { type: 'check' });
    expect(state.correctCount).toBe(1);

    state = practiceReducer(state, { type: 'back' });
    state = practiceReducer(state, {
      type: 'set_response',
      response: { type: 'multiple_choice', optionId: 'wrong-option' },
    });
    state = practiceReducer(state, { type: 'check' });
    expect(state.correctCount).toBe(0);

    const skipAfterCorrect = practiceReducer(
      {
        ...startState(),
        checked: [
          {
            exerciseId: FIXTURE_EXERCISES[0]!.id,
            correct: true,
            selectedIds: [FIXTURE_MC.answer.optionId],
            skipped: false,
          },
        ],
        correctCount: 1,
      },
      { type: 'skip' },
    );
    expect(skipAfterCorrect.correctCount).toBe(0);

    const reopenCreatesSkippedSnapshot = practiceReducer(
      {
        ...startState(),
        phase: 'reviewing',
        checked: [],
      },
      { type: 'reopen', index: 0 },
    );
    expect(reopenCreatesSkippedSnapshot.reopenedPrior).toMatchObject({
      exerciseId: FIXTURE_EXERCISES[0]!.id,
      skipped: true,
      correct: false,
    });

    const backFromCheckedKeepsExistingPrior = practiceReducer(
      {
        ...startState(),
        phase: 'checked',
        checked: [
          { exerciseId: FIXTURE_EXERCISES[0]!.id, correct: false, selectedIds: [] },
          { exerciseId: FIXTURE_EXERCISES[1]!.id, correct: false, selectedIds: [] },
        ],
        index: 1,
        resumeReviewOnBack: true,
        reopenedPrior: {
          exerciseId: FIXTURE_EXERCISES[0]!.id,
          correct: false,
          skipped: true,
          selectedIds: [],
        },
      },
      { type: 'back' },
    );
    expect(backFromCheckedKeepsExistingPrior.phase).toBe('reviewing');
    expect(
      backFromCheckedKeepsExistingPrior.checked.filter(
        (row) => row.exerciseId === FIXTURE_EXERCISES[0]!.id,
      ),
    ).toHaveLength(1);
  });
});
