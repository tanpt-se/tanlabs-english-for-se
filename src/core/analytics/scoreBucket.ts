export type ScoreBucket = '0-49' | '50-69' | '70-84' | '85-100';

export function scoreBucket(score: number): ScoreBucket {
  if (score >= 85) {
    return '85-100';
  }
  if (score >= 70) {
    return '70-84';
  }
  if (score >= 50) {
    return '50-69';
  }
  return '0-49';
}
