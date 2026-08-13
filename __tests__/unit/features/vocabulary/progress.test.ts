import { countKnownInSituation } from '@/features/vocabulary/utils/progress';

describe('countKnownInSituation', () => {
  it('counts only ids for the given situation', () => {
    const known = new Set([
      'task-progress:eta',
      'task-progress:next-step',
      'daily-standup:blocker',
    ]);
    expect(countKnownInSituation('task-progress', known)).toBe(2);
    expect(countKnownInSituation('daily-standup', known)).toBe(1);
    expect(countKnownInSituation('meetings', known)).toBe(0);
  });
});
