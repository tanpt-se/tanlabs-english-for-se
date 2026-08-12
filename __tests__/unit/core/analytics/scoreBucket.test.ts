import { scoreBucket } from '@/core/analytics/scoreBucket';

describe('scoreBucket', () => {
  it('maps scores into bounded analytics buckets', () => {
    expect(scoreBucket(0)).toBe('0-49');
    expect(scoreBucket(49)).toBe('0-49');
    expect(scoreBucket(50)).toBe('50-69');
    expect(scoreBucket(69)).toBe('50-69');
    expect(scoreBucket(70)).toBe('70-84');
    expect(scoreBucket(84)).toBe('70-84');
    expect(scoreBucket(85)).toBe('85-100');
    expect(scoreBucket(100)).toBe('85-100');
  });
});
