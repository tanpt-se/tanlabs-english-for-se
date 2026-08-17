import type { StreakDayState } from '@/features/home/components/StreakCard';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StreakRecord = {
  celebratedDates: string[];
  practiceDates: string[];
};

export function isLocalDateKey(value: string): boolean {
  return DATE_KEY.test(value);
}

export function isCloudStreakUser(userId: string): boolean {
  return UUID.test(userId);
}

export function normalizeDateKeys(values: Iterable<unknown>): string[] {
  const next = new Set<string>();
  for (const value of values) {
    if (typeof value === 'string' && isLocalDateKey(value)) {
      next.add(value);
    }
  }
  return [...next].sort();
}

export function unionStreakRecords(left: StreakRecord, right: StreakRecord): StreakRecord {
  return {
    celebratedDates: normalizeDateKeys([...left.celebratedDates, ...right.celebratedDates]),
    practiceDates: normalizeDateKeys([...left.practiceDates, ...right.practiceDates]),
  };
}

export function streakRecordHasExtras(local: StreakRecord, remote: StreakRecord): boolean {
  const remotePractice = new Set(remote.practiceDates);
  const remoteCelebrated = new Set(remote.celebratedDates);
  return (
    local.practiceDates.some((day) => !remotePractice.has(day)) ||
    local.celebratedDates.some((day) => !remoteCelebrated.has(day))
  );
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftLocalDateKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + days);
  return localDateKey(next);
}

export function consecutiveStreak(dates: Iterable<string>, todayKey: string): number {
  const set = dates instanceof Set ? dates : new Set(dates);
  let count = 0;
  let cursor = todayKey;
  while (set.has(cursor)) {
    count += 1;
    cursor = shiftLocalDateKey(cursor, -1);
  }
  return count;
}

export function weekDayStates(dates: Iterable<string>, now: Date): StreakDayState[] {
  const set = dates instanceof Set ? dates : new Set(dates);
  const todayIndex = (now.getDay() + 6) % 7;
  const todayKey = localDateKey(now);
  const mondayKey = shiftLocalDateKey(todayKey, -todayIndex);
  return Array.from({ length: 7 }, (_, index) => {
    const key = shiftLocalDateKey(mondayKey, index);
    if (set.has(key)) {
      return 'complete';
    }
    if (index === todayIndex) {
      return 'today';
    }
    return 'upcoming';
  });
}

export function streakHeading(count: number): string {
  return count === 1 ? '1 day streak' : `${count} day streak`;
}
