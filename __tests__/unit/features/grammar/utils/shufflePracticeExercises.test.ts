import { shuffleArray } from '@/features/grammar/utils/shuffle';
import { shufflePracticeExercises } from '@/features/grammar/utils/shufflePracticeExercises';

import { FIXTURE_FILL, FIXTURE_MC, FIXTURE_ORDER } from '../../../../helpers/grammarFixtures';

describe('shufflePracticeExercises', () => {
  it('reorders exercises and MC options with a deterministic RNG', () => {
    let tick = 0;
    const random = () => {
      tick += 1;
      return (tick % 7) / 7;
    };
    const once = shufflePracticeExercises([FIXTURE_MC, FIXTURE_FILL, FIXTURE_ORDER], random);
    expect(once.map((item) => item.id).sort()).toEqual(
      [FIXTURE_MC.id, FIXTURE_FILL.id, FIXTURE_ORDER.id].sort(),
    );
    const mc = once.find((item) => item.type === 'multiple_choice');
    expect(mc?.type).toBe('multiple_choice');
    if (mc?.type === 'multiple_choice') {
      expect(mc.payload.options.map((option) => option.id).sort()).toEqual(
        FIXTURE_MC.payload.options.map((option) => option.id).sort(),
      );
    }
  });

  it('shuffles sentence-order token pools', () => {
    let tick = 0;
    const random = () => {
      tick += 1;
      return (tick % 5) / 5;
    };
    const once = shufflePracticeExercises([FIXTURE_ORDER], random)[0];
    expect(once?.type).toBe('sentence_order');
    if (once?.type === 'sentence_order') {
      expect(once.payload.tokens.map((token) => token.id).sort()).toEqual(
        FIXTURE_ORDER.payload.tokens.map((token) => token.id).sort(),
      );
    }
  });

  it('shuffles arrays as a copy', () => {
    const input = [1, 2, 3, 4];
    let n = 0;
    const out = shuffleArray(input, () => {
      n += 0.3;
      return n % 1;
    });
    expect(out).toHaveLength(4);
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    expect(input).toEqual([1, 2, 3, 4]);
    expect(shuffleArray([1]).sort()).toEqual([1]);
    expect(shuffleArray([1, 2]).sort()).toEqual([1, 2]);
  });
});
