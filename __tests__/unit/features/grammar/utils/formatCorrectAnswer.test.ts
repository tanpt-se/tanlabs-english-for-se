import { formatCorrectAnswer } from '@/features/grammar/utils/formatCorrectAnswer';

import { FIXTURE_FILL, FIXTURE_MC, FIXTURE_ORDER } from '../../../../helpers/grammarFixtures';

describe('formatCorrectAnswer', () => {
  it('formats multiple choice, fill blank, and sentence order answers', () => {
    expect(formatCorrectAnswer(FIXTURE_MC)).toEqual(
      FIXTURE_MC.payload.options.find((item) => item.id === FIXTURE_MC.answer.optionId)?.label,
    );
    expect(formatCorrectAnswer({ ...FIXTURE_MC, answer: { optionId: 'missing' } })).toBe('missing');
    expect(formatCorrectAnswer(FIXTURE_FILL)).toBe(FIXTURE_FILL.answer.accepted[0]);
    expect(
      formatCorrectAnswer({
        ...FIXTURE_FILL,
        answer: { accepted: [] },
      }),
    ).toBe('');
    expect(formatCorrectAnswer(FIXTURE_ORDER)).toBe(
      FIXTURE_ORDER.answer.tokenIds
        .map((id) => FIXTURE_ORDER.payload.tokens.find((token) => token.id === id)?.text ?? id)
        .join(' '),
    );
  });
});
