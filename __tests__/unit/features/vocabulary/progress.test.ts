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

  it('counts known remote item ids when the catalog list is provided', () => {
    const known = new Set(['uuid-known', 'uuid-other']);
    expect(countKnownInSituation('task-progress', known, ['uuid-known', 'uuid-missing'])).toBe(1);
    expect(countKnownInSituation('task-progress', known, [])).toBe(0);
  });
});
