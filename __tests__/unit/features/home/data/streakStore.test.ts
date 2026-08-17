import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadStreakSnapshot,
  recordPracticeDay,
  resetStreakCacheForTests,
  streakStorageKey,
} from '@/features/home/data/streakStore';

jest.mock('@/features/home/services/streakService', () => ({
  fetchPracticeStreak: jest.fn(async () => null),
  mergePracticeStreak: jest.fn(async (_record: unknown) => _record),
}));

const cloud = jest.requireMock('@/features/home/services/streakService') as {
  fetchPracticeStreak: jest.Mock;
  mergePracticeStreak: jest.Mock;
};

const CLOUD_USER = '11111111-1111-4111-8111-111111111111';

describe('streakStore', () => {
  beforeEach(async () => {
    resetStreakCacheForTests();
    await AsyncStorage.clear();
    jest.clearAllMocks();
    cloud.fetchPracticeStreak.mockResolvedValue(null);
    cloud.mergePracticeStreak.mockImplementation(async (record: unknown) => record);
  });

  it('celebrates the first practice of a local day only', async () => {
    const day = new Date(2026, 7, 16, 9, 0, 0);
    const first = await recordPracticeDay('user-1', day, day);
    expect(first.shouldCelebrate).toBe(true);
    expect(first.consecutive).toBe(1);
    expect(first.heading).toBe('1 day streak');
    expect(cloud.mergePracticeStreak).not.toHaveBeenCalled();

    const second = await recordPracticeDay(
      'user-1',
      new Date(2026, 7, 16, 21, 0, 0),
      new Date(2026, 7, 16, 21, 0, 0),
    );
    expect(second.shouldCelebrate).toBe(false);
    expect(second.consecutive).toBe(1);

    const nextDay = await recordPracticeDay(
      'user-1',
      new Date(2026, 7, 17, 8, 0, 0),
      new Date(2026, 7, 17, 8, 0, 0),
    );
    expect(nextDay.shouldCelebrate).toBe(true);
    expect(nextDay.consecutive).toBe(2);
  });

  it('keeps a restored attempt on its own local day without celebrating today', async () => {
    const yesterday = new Date(2026, 7, 15, 22, 0, 0);
    const today = new Date(2026, 7, 16, 8, 0, 0);
    const snapshot = await recordPracticeDay('user-1', yesterday, today);
    expect(snapshot.shouldCelebrate).toBe(false);
    expect(snapshot.practiceDates).toEqual(['2026-08-15']);
    expect(snapshot.consecutive).toBe(0);
    expect(snapshot.week[5]).toBe('complete');
  });

  it('ignores invalid or future practicedAt values', async () => {
    const today = new Date(2026, 7, 16, 8, 0, 0);
    await expect(recordPracticeDay('user-1', new Date('not-a-date'), today)).resolves.toMatchObject(
      {
        practiceDates: [],
        shouldCelebrate: false,
      },
    );
    await expect(
      recordPracticeDay('user-1', new Date(2026, 7, 17, 8, 0, 0), today),
    ).resolves.toMatchObject({
      practiceDates: [],
      shouldCelebrate: false,
    });
  });

  it('keeps streaks isolated per user and drops the unscoped legacy key', async () => {
    const day = new Date(2026, 7, 16, 9, 0, 0);
    await recordPracticeDay('user-1', day, day);
    const other = await loadStreakSnapshot('user-2', day);
    expect(other.practiceDates).toEqual([]);
    expect(other.consecutive).toBe(0);

    resetStreakCacheForTests();
    await AsyncStorage.setItem(
      '@tanlabs/practice_streak_v1',
      JSON.stringify({
        practiceDates: ['2026-08-16'],
        celebratedDates: ['2026-08-16'],
      }),
    );
    const signedIn = await loadStreakSnapshot('user-3', day);
    expect(signedIn.practiceDates).toEqual([]);
    expect(await AsyncStorage.getItem('@tanlabs/practice_streak_v1')).toBeNull();
    expect(await AsyncStorage.getItem(streakStorageKey('user-3'))).toBeNull();
  });

  it('loads persisted dates and recovers from corrupt JSON', async () => {
    await AsyncStorage.setItem(
      streakStorageKey('user-1'),
      JSON.stringify({
        practiceDates: ['2026-08-16', 1],
        celebratedDates: ['2026-08-16'],
      }),
    );
    const snapshot = await loadStreakSnapshot('user-1', new Date(2026, 7, 16));
    expect(snapshot.shouldCelebrate).toBe(false);
    expect(snapshot.practiceDates).toEqual(['2026-08-16']);
    expect(snapshot.consecutive).toBe(1);

    resetStreakCacheForTests();
    await AsyncStorage.setItem(streakStorageKey('user-1'), '{');
    await expect(loadStreakSnapshot('user-1', new Date(2026, 7, 16))).resolves.toMatchObject({
      consecutive: 0,
      practiceDates: [],
    });
  });

  it('pulls and merges cloud dates for a signed-in user', async () => {
    const day = new Date(2026, 7, 16, 9, 0, 0);
    cloud.fetchPracticeStreak.mockResolvedValue({
      practiceDates: ['2026-08-15'],
      celebratedDates: ['2026-08-15'],
    });
    const loaded = await loadStreakSnapshot(CLOUD_USER, day);
    expect(loaded.practiceDates).toEqual(['2026-08-15']);
    expect(loaded.consecutive).toBe(0);

    const recorded = await recordPracticeDay(CLOUD_USER, day, day);
    expect(recorded.shouldCelebrate).toBe(true);
    expect(recorded.practiceDates).toEqual(['2026-08-15', '2026-08-16']);
    expect(cloud.mergePracticeStreak).toHaveBeenCalled();
  });

  it('pushes leftover local dates when the cloud copy is behind', async () => {
    const day = new Date(2026, 7, 16);
    await AsyncStorage.setItem(
      streakStorageKey(CLOUD_USER),
      JSON.stringify({
        practiceDates: ['2026-08-16'],
        celebratedDates: ['2026-08-16'],
      }),
    );
    cloud.fetchPracticeStreak.mockResolvedValue({
      practiceDates: [],
      celebratedDates: [],
    });
    cloud.mergePracticeStreak.mockResolvedValue({
      practiceDates: ['2026-08-16'],
      celebratedDates: ['2026-08-16'],
    });
    const snapshot = await loadStreakSnapshot(CLOUD_USER, day);
    expect(cloud.mergePracticeStreak).toHaveBeenCalledWith({
      practiceDates: ['2026-08-16'],
      celebratedDates: ['2026-08-16'],
    });
    expect(snapshot.practiceDates).toEqual(['2026-08-16']);
  });

  it('keeps a local write when cloud merge fails', async () => {
    const day = new Date(2026, 7, 16, 9, 0, 0);
    cloud.mergePracticeStreak.mockRejectedValue(new Error('offline'));
    const snapshot = await recordPracticeDay(CLOUD_USER, day, day);
    expect(snapshot.shouldCelebrate).toBe(true);
    expect(snapshot.practiceDates).toEqual(['2026-08-16']);
  });

  it('stays on the device cache when cloud fetch fails', async () => {
    cloud.fetchPracticeStreak.mockRejectedValue(new Error('offline'));
    await expect(loadStreakSnapshot(CLOUD_USER, new Date(2026, 7, 16))).resolves.toMatchObject({
      consecutive: 0,
      practiceDates: [],
    });
  });
});
