import {
  consecutiveStreak,
  isCloudStreakUser,
  localDateKey,
  shiftLocalDateKey,
  streakHeading,
  streakRecordHasExtras,
  unionStreakRecords,
  weekDayStates,
} from '@/features/home/utils/streak';

describe('streak date helpers', () => {
  it('shifts local calendar keys across month boundaries', () => {
    expect(shiftLocalDateKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(localDateKey(new Date(2026, 7, 16))).toBe('2026-08-16');
  });

  it('counts consecutive days ending today', () => {
    expect(consecutiveStreak(['2026-08-14', '2026-08-15', '2026-08-16'], '2026-08-16')).toBe(3);
    expect(consecutiveStreak(['2026-08-14', '2026-08-16'], '2026-08-16')).toBe(1);
    expect(consecutiveStreak(['2026-08-15'], '2026-08-16')).toBe(0);
  });

  it('marks practiced days complete and today when empty', () => {
    const wednesday = new Date(2026, 7, 19);
    expect(weekDayStates(['2026-08-17', '2026-08-19'], wednesday)).toEqual([
      'complete',
      'upcoming',
      'complete',
      'upcoming',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
    expect(weekDayStates([], wednesday)[2]).toBe('today');
    expect(streakHeading(1)).toBe('1 day streak');
    expect(streakHeading(0)).toBe('0 day streak');
  });

  it('unions cloud records and detects signed-in owners', () => {
    expect(isCloudStreakUser('user-1')).toBe(false);
    expect(isCloudStreakUser('11111111-1111-4111-8111-111111111111')).toBe(true);
    const merged = unionStreakRecords(
      { practiceDates: ['2026-08-16', 'bad'], celebratedDates: [] },
      { practiceDates: ['2026-08-15'], celebratedDates: ['2026-08-15'] },
    );
    expect(merged).toEqual({
      practiceDates: ['2026-08-15', '2026-08-16'],
      celebratedDates: ['2026-08-15'],
    });
    expect(
      streakRecordHasExtras(merged, { practiceDates: ['2026-08-15'], celebratedDates: [] }),
    ).toBe(true);
  });
});
