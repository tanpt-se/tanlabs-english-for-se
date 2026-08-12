import {
  buildCompletedSession,
  createInitialPracticeState,
  gradeExercise,
  isCompletedScore,
  monotonicBestScore,
  normalizeFillBlank,
  normalizeOrderTokenText,
  practiceReducer,
  scorePercent,
} from '@/features/grammar/utils';
import {
  validateExercise,
  validateLessonContent,
  validateLessonDefinition,
  validateTopicDefinition,
} from '@/features/grammar/validation/content';

import {
  FIXTURE_FILL,
  FIXTURE_LESSON,
  FIXTURE_MC,
  FIXTURE_ORDER,
} from '../../../../helpers/grammarFixtures';

const mc = FIXTURE_MC;
const fill = FIXTURE_FILL;
const order = FIXTURE_ORDER;

describe('PH2-03 grammar practice engine', () => {
  it('grades multiple choice, fill-blank, and sentence order deterministically', () => {
    expect(
      gradeExercise(mc, { type: 'multiple_choice', optionId: mc.answer.optionId }),
    ).toMatchObject({ correct: true });
    expect(gradeExercise(mc, { type: 'multiple_choice', optionId: 'missing' })).toMatchObject({
      error: 'Unknown option id',
    });
    expect(gradeExercise(mc, { type: 'fill_blank', text: 'x' } as never)).toMatchObject({
      error: 'Response type mismatch',
    });

    expect(normalizeFillBlank("  Don't  ")).toBe("don't");
    expect(normalizeOrderTokenText('request.')).toBe('request');
    expect(
      gradeExercise(fill, { type: 'fill_blank', text: `  ${fill.answer.accepted[0]}  ` }),
    ).toMatchObject({ correct: true });
    expect(gradeExercise(fill, { type: 'fill_blank', text: '' })).toMatchObject({
      error: 'Empty fill-blank response',
    });
    expect(gradeExercise(fill, { type: 'fill_blank', text: 'nope' })).toMatchObject({
      correct: false,
    });

    expect(
      gradeExercise(order, { type: 'sentence_order', tokenIds: order.answer.tokenIds }),
    ).toMatchObject({ correct: true, selectedIds: order.answer.tokenIds });
    const wrong = [...order.answer.tokenIds].reverse();
    expect(gradeExercise(order, { type: 'sentence_order', tokenIds: wrong })).toMatchObject({
      correct: false,
    });
    expect(gradeExercise(order, { type: 'sentence_order', tokenIds: ['x'] })).toMatchObject({
      error: 'tokenIds length mismatch',
    });
    expect(
      gradeExercise(order, {
        type: 'sentence_order',
        tokenIds: order.answer.tokenIds.map(() => 'missing'),
      }),
    ).toMatchObject({ error: 'Unknown token id' });
  });

  it('scores 0/69/70/100 and never decreases best score', () => {
    expect(scorePercent(0, 0)).toBe(0);
    expect(scorePercent(0, 10)).toBe(0);
    expect(scorePercent(7, 10)).toBe(70);
    expect(scorePercent(6, 10)).toBe(60);
    expect(isCompletedScore(69)).toBe(false);
    expect(isCompletedScore(70)).toBe(true);
    expect(monotonicBestScore(80, 70)).toBe(80);
    expect(monotonicBestScore(null, 70)).toBe(70);
  });

  it('covers reset and inert continue/check edge paths', () => {
    let state = createInitialPracticeState();
    state = practiceReducer(state, {
      type: 'start',
      exercises: [mc],
      clientAttemptId: 'id',
      topicId: 't',
      lessonId: 'l',
      contentRevision: 1,
      startedAt: '2026-08-11T00:00:00.000Z',
    });
    expect(practiceReducer(state, { type: 'continue' })).toBe(state);
    expect(
      practiceReducer(state, {
        type: 'retry',
        clientAttemptId: 'id-2',
        startedAt: '2026-08-11T00:00:01.000Z',
      }).clientAttemptId,
    ).toBe('id-2');
    expect(practiceReducer(createInitialPracticeState(), { type: 'reset' }).exercises).toEqual([]);
    expect(practiceReducer(state, { type: 'nope' } as never)).toEqual(state);
    expect(
      practiceReducer(createInitialPracticeState(), {
        type: 'retry',
        clientAttemptId: 'x',
        startedAt: 'y',
      }),
    ).toEqual(createInitialPracticeState());
    expect(buildCompletedSession(createInitialPracticeState())).toBeNull();
  });

  it('runs reducer transitions and builds a privacy-bounded session', () => {
    const set = [mc, fill];
    let state = createInitialPracticeState();
    expect(
      practiceReducer(state, {
        type: 'start',
        exercises: [],
        clientAttemptId: 'x',
        topicId: 't',
        lessonId: 'l',
        contentRevision: 1,
        startedAt: '2026-08-11T00:00:00.000Z',
      }),
    ).toBe(state);

    state = practiceReducer(state, {
      type: 'start',
      exercises: set,
      clientAttemptId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      topicId: 'topic-1',
      lessonId: 'lesson-1',
      contentRevision: 1,
      startedAt: '2026-08-11T00:00:00.000Z',
    });

    expect(practiceReducer(state, { type: 'check' })).toBe(state);
    expect(
      practiceReducer(state, { type: 'set_response', response: { type: 'fill_blank', text: 'x' } })
        .response?.type,
    ).toBe('fill_blank');

    state = practiceReducer(state, {
      type: 'set_response',
      response: { type: 'multiple_choice', optionId: mc.answer.optionId },
    });
    state = practiceReducer(state, { type: 'check' });
    expect(state.phase).toBe('checked');
    expect(state.lastCorrect).toBe(true);
    expect(
      practiceReducer(state, { type: 'set_response', response: { type: 'fill_blank', text: 'x' } }),
    ).toBe(state);
    expect(practiceReducer(state, { type: 'check' })).toBe(state);

    state = practiceReducer(state, { type: 'continue' });
    expect(practiceReducer(state, { type: 'continue' })).toBe(state);
    state = practiceReducer(state, {
      type: 'set_response',
      response: { type: 'fill_blank', text: fill.answer.accepted[0] },
    });
    state = practiceReducer(state, { type: 'check' });
    state = practiceReducer(state, { type: 'continue' });
    expect(state.phase).toBe('reviewing');
    state = practiceReducer(state, { type: 'submit' });
    expect(state.phase).toBe('completed');
    expect(state.score).toBe(100);
    expect(state.completed).toBe(true);

    const session = buildCompletedSession(state);
    expect(session?.clientAttemptId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(session?.answers.every((answer) => !('text' in answer))).toBe(true);
    expect(buildCompletedSession(createInitialPracticeState())).toBeNull();

    const retried = practiceReducer(state, {
      type: 'retry',
      clientAttemptId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      startedAt: '2026-08-11T01:00:00.000Z',
    });
    expect(retried.phase).toBe('answering');
    expect(retried.clientAttemptId).toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    expect(retried.correctCount).toBe(0);
    expect(
      practiceReducer(createInitialPracticeState(), {
        type: 'retry',
        clientAttemptId: 'c',
        startedAt: '2026-08-11T01:00:00.000Z',
      }).exercises,
    ).toEqual([]);
  });

  it('skips without feedback and backs out of a check or previous item', () => {
    let state = practiceReducer(createInitialPracticeState(), {
      type: 'start',
      exercises: [mc, fill],
      clientAttemptId: 'skip-id',
      topicId: 't',
      lessonId: 'l',
      contentRevision: 1,
      startedAt: '2026-08-11T00:00:00.000Z',
    });

    expect(practiceReducer(state, { type: 'back' })).toBe(state);

    state = practiceReducer(state, { type: 'skip' });
    expect(state.phase).toBe('answering');
    expect(state.index).toBe(1);
    expect(state.lastCorrect).toBeNull();
    expect(state.lastExplanation).toBeNull();
    expect(state.correctCount).toBe(0);
    expect(state.checked).toHaveLength(1);
    expect(state.checked[0]?.skipped).toBe(true);

    state = practiceReducer(state, { type: 'back' });
    expect(state.phase).toBe('answering');
    expect(state.index).toBe(0);
    expect(state.checked).toHaveLength(0);

    state = practiceReducer(state, {
      type: 'set_response',
      response: { type: 'multiple_choice', optionId: mc.answer.optionId },
    });
    state = practiceReducer(state, { type: 'check' });
    expect(state.phase).toBe('checked');
    state = practiceReducer(state, { type: 'back' });
    expect(state.phase).toBe('answering');
    expect(state.index).toBe(0);
    expect(state.checked).toHaveLength(0);

    state = practiceReducer(state, {
      type: 'set_response',
      response: { type: 'multiple_choice', optionId: mc.answer.optionId },
    });
    state = practiceReducer(state, { type: 'check' });
    state = practiceReducer(state, { type: 'continue' });
    expect(state.index).toBe(1);

    state = practiceReducer(state, { type: 'skip' });
    expect(state.phase).toBe('reviewing');
    expect(state.checked).toHaveLength(2);
    expect(state.lastExplanation).toBeNull();

    state = practiceReducer(state, { type: 'reopen', index: 1 });
    expect(state.phase).toBe('answering');
    expect(state.index).toBe(1);
    expect(state.checked).toHaveLength(1);
    expect(state.resumeReviewOnBack).toBe(true);

    // Previous after reopen restores prior coverage and returns to Review.
    state = practiceReducer(state, { type: 'back' });
    expect(state.phase).toBe('reviewing');
    expect(state.checked).toHaveLength(2);
    expect(state.checked.find((row) => row.exerciseId === fill.id)?.skipped).toBe(true);
    expect(state.resumeReviewOnBack).toBe(false);
    expect(state.reopenedPrior).toBeNull();

    state = practiceReducer(state, { type: 'reopen', index: 1 });
    expect(state.reopenedPrior?.skipped).toBe(true);
    state = practiceReducer(state, {
      type: 'set_response',
      response: { type: 'fill_blank', text: fill.answer.accepted[0] },
    });
    state = practiceReducer(state, { type: 'check' });
    state = practiceReducer(state, { type: 'continue' });
    expect(state.phase).toBe('reviewing');

    state = practiceReducer(state, { type: 'submit' });
    expect(state.phase).toBe('completed');
    expect(state.score).toBe(100);
  });

  it('restores prior coverage when aborting reopen from checked feedback', () => {
    let state = practiceReducer(createInitialPracticeState(), {
      type: 'start',
      exercises: [mc, fill],
      clientAttemptId: 'abort-checked',
      topicId: 't',
      lessonId: 'l',
      contentRevision: 1,
      startedAt: '2026-08-11T00:00:00.000Z',
    });
    state = practiceReducer(state, { type: 'skip' });
    state = practiceReducer(state, { type: 'skip' });
    expect(state.phase).toBe('reviewing');

    state = practiceReducer(state, { type: 'reopen', index: 0 });
    state = practiceReducer(state, {
      type: 'set_response',
      response: { type: 'multiple_choice', optionId: mc.answer.optionId },
    });
    state = practiceReducer(state, { type: 'check' });
    expect(state.phase).toBe('checked');
    expect(state.resumeReviewOnBack).toBe(true);

    state = practiceReducer(state, { type: 'back' });
    expect(state.phase).toBe('reviewing');
    expect(state.checked).toHaveLength(2);
    expect(state.checked.find((row) => row.exerciseId === mc.id)?.skipped).toBe(true);
  });

  it('rejects submit when coverage is incomplete', () => {
    let state = practiceReducer(createInitialPracticeState(), {
      type: 'start',
      exercises: [mc, fill],
      clientAttemptId: 'incomplete',
      topicId: 't',
      lessonId: 'l',
      contentRevision: 1,
      startedAt: '2026-08-11T00:00:00.000Z',
    });
    state = practiceReducer(state, { type: 'skip' });
    state = {
      ...state,
      phase: 'reviewing',
      checked: state.checked.slice(0, 1),
    };
    expect(practiceReducer(state, { type: 'submit' }).phase).toBe('reviewing');
  });
});

describe('PH2-01 validation edge cases', () => {
  it('rejects malformed topic, lesson, and exercise payloads', () => {
    expect(validateTopicDefinition({ ...FIXTURE_LESSON, slug: 'nope' } as never)).toMatchObject({
      ok: false,
    });
    expect(
      validateTopicDefinition({
        slug: 'present-simple',
        title: '',
        description: 'x',
        sortOrder: 1,
      }),
    ).toMatchObject({ ok: false });

    expect(validateLessonContent({ ...FIXTURE_LESSON.content, usage: '' })).toMatchObject({
      ok: false,
    });
    expect(
      validateLessonContent({
        ...FIXTURE_LESSON.content,
        forms: { ...FIXTURE_LESSON.content.forms, affirmative: '' },
      }),
    ).toMatchObject({ ok: false });
    expect(validateLessonContent({ ...FIXTURE_LESSON.content, examples: [] })).toMatchObject({
      ok: false,
    });
    expect(
      validateLessonContent({
        ...FIXTURE_LESSON.content,
        examples: [
          ...FIXTURE_LESSON.content.examples,
          {
            id: FIXTURE_LESSON.content.examples[0].id,
            context: 'dup',
            sentence: 'dup',
          },
        ],
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateLessonContent({
        ...FIXTURE_LESSON.content,
        examples: FIXTURE_LESSON.content.examples.map((item, index) =>
          index === 0 ? { ...item, sentence: '' } : item,
        ),
      }),
    ).toMatchObject({ ok: false });
    expect(validateLessonContent({ ...FIXTURE_LESSON.content, tips: [] })).toMatchObject({
      ok: false,
    });
    expect(validateLessonContent({ ...FIXTURE_LESSON.content, tips: [''] })).toMatchObject({
      ok: false,
    });

    expect(
      validateLessonDefinition({
        ...FIXTURE_LESSON,
        topicSlug: 'missing' as never,
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateLessonDefinition({
        ...FIXTURE_LESSON,
        slug: '',
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateLessonDefinition({
        ...FIXTURE_LESSON,
        contentSchemaVersion: 99,
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateLessonDefinition({
        ...FIXTURE_LESSON,
        contentRevision: 0,
      }),
    ).toMatchObject({ ok: false });

    expect(
      validateExercise({
        ...mc,
        payload: { options: [{ id: 'a', label: 'only' }] },
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...mc,
        payload: {
          options: [
            { id: 'a', label: 'A' },
            { id: 'a', label: 'B' },
          ],
        },
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...mc,
        payload: {
          options: [
            { id: 'a', label: '' },
            { id: 'b', label: 'B' },
          ],
        },
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...mc,
        answer: { optionId: 'missing' },
      }),
    ).toMatchObject({ ok: false });

    expect(
      validateExercise({
        ...fill,
        payload: { template: 'no blank' },
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...fill,
        answer: { accepted: [] },
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...fill,
        answer: { accepted: [''] },
      }),
    ).toMatchObject({ ok: false });

    expect(
      validateExercise({
        ...order,
        payload: { tokens: [{ id: 't1', text: 'only' }] },
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...order,
        payload: {
          tokens: [
            { id: 't1', text: 'A' },
            { id: 't1', text: 'B' },
          ],
        },
        answer: { tokenIds: ['t1', 't1'] },
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...order,
        answer: { tokenIds: ['t1'] },
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...order,
        answer: { tokenIds: order.answer.tokenIds.map(() => 'missing') },
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...order,
        payload: {
          tokens: [
            { id: 't1', text: '' },
            { id: 't2', text: 'B' },
          ],
        },
        answer: { tokenIds: ['t1', 't2'] },
      }),
    ).toMatchObject({ ok: false });

    expect(
      validateExercise({
        ...mc,
        prompt: '',
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...mc,
        contentSchemaVersion: 9,
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateExercise({
        ...mc,
        topicSlug: 'nope' as never,
      }),
    ).toMatchObject({ ok: false });
    expect(validateExercise({ ...mc, type: 'essay' } as never)).toMatchObject({ ok: false });
  });
});
