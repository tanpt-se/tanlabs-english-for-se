import { GRAMMAR_EXERCISES, GRAMMAR_LESSONS } from '@/features/grammar/data/seedInventory';
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

const mc = GRAMMAR_EXERCISES.find((item) => item.type === 'multiple_choice')!;
const fill = GRAMMAR_EXERCISES.find((item) => item.type === 'fill_blank')!;
const order = GRAMMAR_EXERCISES.find((item) => item.type === 'sentence_order')!;

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
});

describe('PH2-01 validation edge cases', () => {
  it('rejects malformed topic, lesson, and exercise payloads', () => {
    expect(validateTopicDefinition({ ...GRAMMAR_LESSONS[0], slug: 'nope' } as never)).toMatchObject(
      {
        ok: false,
      },
    );
    expect(
      validateTopicDefinition({
        slug: 'present-simple',
        title: '',
        description: 'x',
        level: 'A2',
        sortOrder: 1,
      }),
    ).toMatchObject({ ok: false });

    expect(validateLessonContent({ ...GRAMMAR_LESSONS[0].content, usage: '' })).toMatchObject({
      ok: false,
    });
    expect(
      validateLessonContent({
        ...GRAMMAR_LESSONS[0].content,
        forms: { ...GRAMMAR_LESSONS[0].content.forms, affirmative: '' },
      }),
    ).toMatchObject({ ok: false });
    expect(validateLessonContent({ ...GRAMMAR_LESSONS[0].content, examples: [] })).toMatchObject({
      ok: false,
    });
    expect(
      validateLessonContent({
        ...GRAMMAR_LESSONS[0].content,
        examples: [
          ...GRAMMAR_LESSONS[0].content.examples,
          { id: 'ps-e1', context: 'dup', sentence: 'dup' },
        ],
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateLessonContent({
        ...GRAMMAR_LESSONS[0].content,
        examples: GRAMMAR_LESSONS[0].content.examples.map((item, index) =>
          index === 0 ? { ...item, sentence: '' } : item,
        ),
      }),
    ).toMatchObject({ ok: false });
    expect(validateLessonContent({ ...GRAMMAR_LESSONS[0].content, tips: [] })).toMatchObject({
      ok: false,
    });
    expect(validateLessonContent({ ...GRAMMAR_LESSONS[0].content, tips: [''] })).toMatchObject({
      ok: false,
    });

    expect(
      validateLessonDefinition({
        ...GRAMMAR_LESSONS[0],
        topicSlug: 'missing' as never,
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateLessonDefinition({
        ...GRAMMAR_LESSONS[0],
        slug: '',
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateLessonDefinition({
        ...GRAMMAR_LESSONS[0],
        contentSchemaVersion: 99,
      }),
    ).toMatchObject({ ok: false });
    expect(
      validateLessonDefinition({
        ...GRAMMAR_LESSONS[0],
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
