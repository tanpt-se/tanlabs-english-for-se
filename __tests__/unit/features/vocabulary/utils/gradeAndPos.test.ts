import { gradeExercise } from '@/features/vocabulary/utils/grade';
import { getPosMeta, inferPos, normalizePos, resolvePos } from '@/features/vocabulary/utils/pos';

import {
  FIXTURE_CHOOSE,
  FIXTURE_FILL,
  FIXTURE_ORDER,
} from '../../../../helpers/vocabularyFixtures';

describe('vocabulary gradeExercise remaining branches', () => {
  it('covers mismatch, unknown ids, empty fill, and default type', () => {
    expect(gradeExercise(FIXTURE_CHOOSE, { type: 'fill_blank', text: 'x' })).toMatchObject({
      error: 'Response type mismatch',
    });
    expect(
      gradeExercise(FIXTURE_CHOOSE, { type: 'choose_expression', optionId: 'missing' }),
    ).toMatchObject({ error: 'Unknown option id' });
    expect(
      gradeExercise(FIXTURE_CHOOSE, { type: 'choose_expression', optionId: 'opt_b' }),
    ).toMatchObject({ correct: false });

    expect(gradeExercise(FIXTURE_FILL, { type: 'fill_blank', text: '   ' })).toMatchObject({
      error: 'Empty fill-blank response',
    });
    expect(gradeExercise(FIXTURE_FILL, { type: 'fill_blank', text: 'blocker' })).toMatchObject({
      correct: true,
    });

    expect(
      gradeExercise(FIXTURE_ORDER, { type: 'sentence_order', tokenIds: ['t1'] }),
    ).toMatchObject({ error: 'tokenIds length mismatch' });
    expect(
      gradeExercise(FIXTURE_ORDER, { type: 'sentence_order', tokenIds: ['t1', 'x', 't3'] }),
    ).toMatchObject({ error: 'Unknown token id' });
    expect(
      gradeExercise(FIXTURE_ORDER, {
        type: 'sentence_order',
        tokenIds: ['t3', 't2', 't1'],
      }),
    ).toMatchObject({ correct: false });

    expect(
      gradeExercise({ ...FIXTURE_CHOOSE, type: 'unknown' as never }, {
        type: 'unknown',
        optionId: 'opt_a',
      } as never),
    ).toMatchObject({ error: 'Unknown exercise type' });
  });
});

describe('vocabulary POS remaining branches', () => {
  it('covers normalize/getPosMeta and word heuristics', () => {
    expect(normalizePos(null)).toBeNull();
    expect(normalizePos('  ADJ ')).toBe('adj');
    expect(getPosMeta('phr v').name).toBe('phrasal verb');
    expect(inferPos('word', 'blocked')).toBe('adj');
    expect(inferPos('word', 'quickly')).toBe('adv');
    expect(inferPos('word', 'on track')).toBe('prep');
    expect(inferPos('word', 'redeploy')).toBe('v');
    expect(resolvePos('word', 'backlog', 12)).toBe('n');
  });
});
