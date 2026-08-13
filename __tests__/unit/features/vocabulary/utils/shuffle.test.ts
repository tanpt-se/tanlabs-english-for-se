import { shuffleArray } from '@/features/vocabulary/utils/shuffle';

describe('shuffleArray', () => {
  it('returns a permuted copy without mutating the source', () => {
    const source = ['a', 'b', 'c', 'd'];
    const shuffled = shuffleArray(source, () => 0);
    expect(shuffled).toEqual(['b', 'c', 'd', 'a']);
    expect(source).toEqual(['a', 'b', 'c', 'd']);
  });

  it('handles empty and single-item arrays', () => {
    expect(shuffleArray([])).toEqual([]);
    expect(shuffleArray(['only'])).toEqual(['only']);
  });
});
