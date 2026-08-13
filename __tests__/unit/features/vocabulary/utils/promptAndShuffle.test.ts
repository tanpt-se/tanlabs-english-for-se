import { formatCorrectAnswer, splitExercisePrompt } from '@/features/vocabulary/utils/prompt';
import { shufflePracticeExercises } from '@/features/vocabulary/utils/shufflePracticeExercises';

import {
  FIXTURE_CHOOSE,
  FIXTURE_FILL,
  FIXTURE_ORDER,
} from '../../../../helpers/vocabularyFixtures';

describe('vocabulary prompt + shuffle', () => {
  it('splits instruction prefixes and formats answers', () => {
    expect(splitExercisePrompt('Choose the best expression: Hello', 'choose_expression')).toEqual({
      instruction: 'Choose the best expression',
      stem: 'Hello',
    });
    expect(splitExercisePrompt('Plain stem', 'fill_blank')).toEqual({
      instruction: 'Fill in the blank',
      stem: 'Plain stem',
    });

    expect(formatCorrectAnswer(FIXTURE_CHOOSE)).toBe('blocker');
    expect(
      formatCorrectAnswer({
        ...FIXTURE_CHOOSE,
        answer: { optionId: 'missing' },
      }),
    ).toBe('missing');
    expect(formatCorrectAnswer(FIXTURE_FILL)).toBe('blocker');
    expect(formatCorrectAnswer(FIXTURE_ORDER)).toBe('I am blocked.');
  });

  it('shuffles choose options and sentence tokens', () => {
    let i = 0;
    const random = () => {
      i += 1;
      return i % 2 === 0 ? 0.9 : 0.1;
    };
    const shuffled = shufflePracticeExercises(
      [FIXTURE_CHOOSE, FIXTURE_FILL, FIXTURE_ORDER],
      random,
    );
    expect(shuffled).toHaveLength(3);
    expect(shuffled.find((row) => row.type === 'fill_blank')).toEqual(FIXTURE_FILL);
    const choose = shuffled.find((row) => row.type === 'choose_expression');
    expect(choose?.type).toBe('choose_expression');
    const order = shuffled.find((row) => row.type === 'sentence_order');
    expect(order?.type).toBe('sentence_order');
  });
});
