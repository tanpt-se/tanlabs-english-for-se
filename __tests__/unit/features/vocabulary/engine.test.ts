import type { VocabularyExercise } from '@/features/vocabulary/types/content';
import { aggregateItemResults } from '@/features/vocabulary/utils/aggregateItemResults';
import { composeSituationSession, SESSION_MIX } from '@/features/vocabulary/utils/composeSession';
import { gradeExercise } from '@/features/vocabulary/utils/grade';
import { normalizeFillBlank } from '@/features/vocabulary/utils/normalize';
import { isWeakItem, sortWeakItems } from '@/features/vocabulary/utils/weakItems';

const feedback = {
  expression: 'blocker',
  meaning: 'Something that stops progress',
  context: 'Standup',
  example: 'I am blocked by the API.',
  explanation: 'Name the blocker clearly.',
};

function choose(id: string, correct = 'opt_a'): VocabularyExercise {
  return {
    id,
    situationId: 'task-progress',
    itemId: `task-progress:${id}`,
    type: 'choose_expression',
    prompt: 'Something that stops progress',
    payload: {
      options: [
        { id: 'opt_a', text: 'blocker' },
        { id: 'opt_b', text: 'ship' },
        { id: 'opt_c', text: 'merge' },
        { id: 'opt_d', text: 'deploy' },
      ],
    },
    answer: { optionId: correct },
    feedback,
    sortOrder: 1,
    contentSchemaVersion: 1,
  };
}

function fill(id: string): VocabularyExercise {
  return {
    id,
    situationId: 'task-progress',
    itemId: `task-progress:${id}`,
    type: 'fill_blank',
    prompt: 'I hit a ___ on auth.',
    payload: { accepted: ['blocker', 'Blocker'] },
    answer: { accepted: ['blocker', 'Blocker'] },
    feedback,
    sortOrder: 2,
    contentSchemaVersion: 1,
  };
}

function order(id: string): VocabularyExercise {
  return {
    id,
    situationId: 'task-progress',
    itemId: `task-progress:${id}`,
    type: 'sentence_order',
    prompt: 'Order the words',
    payload: {
      tokens: [
        { id: 't1', text: 'I' },
        { id: 't2', text: 'am' },
        { id: 't3', text: 'blocked.' },
      ],
    },
    answer: { tokenIds: ['t1', 't2', 't3'] },
    feedback,
    sortOrder: 3,
    contentSchemaVersion: 1,
  };
}

describe('vocabulary engine', () => {
  it('grades choose_expression by option id', () => {
    const exercise = choose('ce1');
    expect(gradeExercise(exercise, { type: 'choose_expression', optionId: 'opt_a' })).toEqual(
      expect.objectContaining({ correct: true }),
    );
    expect(gradeExercise(exercise, { type: 'choose_expression', optionId: 'opt_b' })).toEqual(
      expect.objectContaining({ correct: false }),
    );
  });

  it('normalizes fill_blank (trim, case, curly apostrophe)', () => {
    expect(normalizeFillBlank('  Blocker’s  ')).toBe("blocker's");
    const exercise = fill('fb1');
    expect(gradeExercise(exercise, { type: 'fill_blank', text: ' Blocker ' })).toEqual(
      expect.objectContaining({ correct: true }),
    );
  });

  it('grades sentence_order by token ids', () => {
    const exercise = order('so1');
    expect(
      gradeExercise(exercise, { type: 'sentence_order', tokenIds: ['t1', 't2', 't3'] }),
    ).toEqual(expect.objectContaining({ correct: true }));
    expect(
      gradeExercise(exercise, { type: 'sentence_order', tokenIds: ['t3', 't2', 't1'] }),
    ).toEqual(expect.objectContaining({ correct: false }));
  });

  it('composes a mixed session preferring 5/3/2', () => {
    const pool: VocabularyExercise[] = [];
    for (let i = 0; i < 12; i += 1) pool.push(choose(`c${i}`));
    for (let i = 0; i < 8; i += 1) pool.push(fill(`f${i}`));
    for (let i = 0; i < 6; i += 1) pool.push(order(`o${i}`));
    const result = composeSituationSession(pool, { random: () => 0.1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.exercises.length).toBeGreaterThanOrEqual(8);
    expect(result.exercises.length).toBeLessThanOrEqual(12);
    const counts = { choose_expression: 0, fill_blank: 0, sentence_order: 0 };
    for (const exercise of result.exercises) {
      counts[exercise.type] += 1;
    }
    expect(counts.choose_expression).toBeGreaterThanOrEqual(SESSION_MIX.choose_expression - 1);
    expect(counts.fill_blank).toBeGreaterThanOrEqual(1);
    expect(counts.sentence_order).toBeGreaterThanOrEqual(1);
  });

  it('aggregates item results with any-incorrect rule', () => {
    const exercises = [choose('a'), choose('a2')];
    exercises[1] = { ...exercises[1]!, id: 'ce-a2', itemId: exercises[0]!.itemId };
    const outcomes = aggregateItemResults(exercises, [
      { exerciseId: 'a', correct: true },
      { exerciseId: 'ce-a2', correct: false },
    ]);
    expect(outcomes).toEqual([{ itemId: exercises[0]!.itemId, correct: false }]);
  });

  it('applies weak predicate and order', () => {
    const rows = sortWeakItems([
      {
        itemId: 'b',
        lastResult: true,
        incorrectCount: 2,
        correctCount: 1,
        lastSeenAt: '2026-01-02T00:00:00.000Z',
        sortOrder: 2,
      },
      {
        itemId: 'a',
        lastResult: false,
        incorrectCount: 0,
        correctCount: 0,
        lastSeenAt: '2026-01-01T00:00:00.000Z',
        sortOrder: 1,
      },
      {
        itemId: 'c',
        lastResult: true,
        incorrectCount: 0,
        correctCount: 3,
        lastSeenAt: '2026-01-03T00:00:00.000Z',
        sortOrder: 3,
      },
    ]);
    expect(rows.map((row) => row.itemId)).toEqual(['a', 'b']);
    expect(isWeakItem(rows[0]!)).toBe(true);
  });
});
