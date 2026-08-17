import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StreakDayState } from '@/features/home/components/StreakCard';
import { fetchPracticeStreak, mergePracticeStreak } from '@/features/home/services/streakService';
import {
  consecutiveStreak,
  isCloudStreakUser,
  localDateKey,
  streakHeading,
  streakRecordHasExtras,
  unionStreakRecords,
  weekDayStates,
  type StreakRecord,
} from '@/features/home/utils/streak';

const STORAGE_PREFIX = '@tanlabs/practice_streak_v1';
const LEGACY_STORAGE_KEY = STORAGE_PREFIX;

export type StreakSnapshot = {
  consecutive: number;
  heading: string;
  practiceDates: string[];
  shouldCelebrate: boolean;
  week: StreakDayState[];
};

let cache: StreakRecord | null = null;
let cacheUserId: string | null = null;
let hydratePromise: Promise<void> | null = null;

export function streakStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function emptyState(): StreakRecord {
  return { celebratedDates: [], practiceDates: [] };
}

function parseStored(raw: unknown): StreakRecord {
  if (!raw || typeof raw !== 'object') {
    return emptyState();
  }
  const row = raw as { celebratedDates?: unknown; practiceDates?: unknown };
  return unionStreakRecords(
    {
      celebratedDates: Array.isArray(row.celebratedDates) ? (row.celebratedDates as string[]) : [],
      practiceDates: Array.isArray(row.practiceDates) ? (row.practiceDates as string[]) : [],
    },
    emptyState(),
  );
}

function snapshotFrom(state: StreakRecord, now: Date, shouldCelebrate: boolean): StreakSnapshot {
  const today = localDateKey(now);
  const consecutive = consecutiveStreak(state.practiceDates, today);
  return {
    consecutive,
    heading: streakHeading(consecutive),
    practiceDates: [...state.practiceDates],
    shouldCelebrate,
    week: weekDayStates(state.practiceDates, now),
  };
}

function adopt(userId: string, state: StreakRecord): StreakRecord {
  if (cacheUserId === userId) {
    cache = state;
  }
  return state;
}

async function persist(userId: string, state: StreakRecord): Promise<void> {
  await AsyncStorage.setItem(streakStorageKey(userId), JSON.stringify(state));
}

async function hydrate(userId: string): Promise<void> {
  if (cacheUserId !== userId) {
    cache = null;
    hydratePromise = null;
    cacheUserId = userId;
  }
  if (cache) {
    return;
  }
  if (!hydratePromise) {
    const requestedUserId = userId;
    hydratePromise = (async () => {
      try {
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
        const raw = await AsyncStorage.getItem(streakStorageKey(requestedUserId));
        if (cacheUserId !== requestedUserId) {
          return;
        }
        cache = parseStored(raw ? (JSON.parse(raw) as unknown) : null);
      } catch {
        if (cacheUserId !== requestedUserId) {
          return;
        }
        cache = emptyState();
      }
    })();
  }
  await hydratePromise;
}

async function syncCloud(userId: string): Promise<void> {
  if (!isCloudStreakUser(userId)) {
    return;
  }
  try {
    const remote = await fetchPracticeStreak();
    if (!remote || cacheUserId !== userId) {
      return;
    }
    const merged = unionStreakRecords(cache ?? emptyState(), remote);
    adopt(userId, merged);
    await persist(userId, merged);
    if (!streakRecordHasExtras(merged, remote)) {
      return;
    }
    const pushed = await mergePracticeStreak(merged);
    if (cacheUserId !== userId) {
      return;
    }
    adopt(userId, pushed);
    await persist(userId, pushed);
  } catch {
    // Offline: keep the device cache and retry on the next Home focus.
  }
}

export async function loadStreakSnapshot(
  userId: string,
  now = new Date(),
): Promise<StreakSnapshot> {
  await hydrate(userId);
  await syncCloud(userId);
  return snapshotFrom(cache ?? emptyState(), now, false);
}

/**
 * Records the local calendar day of `practicedAt`.
 * A restored Result still keeps that completion day, but the Today modal
 * only fires when that day is the device's current local date.
 */
export async function recordPracticeDay(
  userId: string,
  practicedAt: Date,
  now = new Date(),
): Promise<StreakSnapshot> {
  await hydrate(userId);
  await syncCloud(userId);
  let state = cache ?? emptyState();
  if (Number.isNaN(practicedAt.getTime())) {
    return snapshotFrom(state, now, false);
  }
  const practicedDay = localDateKey(practicedAt);
  const today = localDateKey(now);
  if (practicedDay > today) {
    return snapshotFrom(state, now, false);
  }
  const dates = new Set(state.practiceDates);
  const celebrated = new Set(state.celebratedDates);
  const shouldCelebrate = practicedDay === today && !celebrated.has(practicedDay);
  dates.add(practicedDay);
  if (shouldCelebrate) {
    celebrated.add(practicedDay);
  }
  state = { celebratedDates: [...celebrated].sort(), practiceDates: [...dates].sort() };
  adopt(userId, state);
  await persist(userId, state);
  if (isCloudStreakUser(userId)) {
    try {
      const pushed = await mergePracticeStreak(state);
      if (cacheUserId === userId) {
        state = adopt(userId, pushed);
        await persist(userId, pushed);
      }
    } catch {
      // Keep the local write; Home refresh will merge when back online.
    }
  }
  return snapshotFrom(state, now, shouldCelebrate);
}

/** Test helper */
export function resetStreakCacheForTests(): void {
  cache = null;
  cacheUserId = null;
  hydratePromise = null;
}
