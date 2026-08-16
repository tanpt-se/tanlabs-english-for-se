import { libraryRank } from '@/features/vocabulary/utils/libraryRank';

describe('libraryRank', () => {
  it('puts cores first, then phrases with examples ahead of bare words', () => {
    expect(
      libraryRank({ isCore: true, coreOrder: 2, type: 'phrase', sortOrder: 99, examples: [] }),
    ).toBe(2);
    const phrase = libraryRank({
      type: 'phrase',
      sortOrder: 40,
      examples: [['standup', 'We are on track.']],
      patterns: ['on track'],
    });
    const word = libraryRank({ type: 'word', sortOrder: 1, examples: [], patterns: [] });
    expect(phrase).toBeLessThan(word);
  });
});
