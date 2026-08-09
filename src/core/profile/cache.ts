import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Profile } from '@/types/database';

function cacheKey(userId: string) {
  return `tanlabs.profile.cache.${userId}`;
}

export async function readCachedProfile(userId: string): Promise<Profile | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export async function writeCachedProfile(userId: string, profile: Profile): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(profile));
  } catch {
    // Non-blocking cache write
  }
}

export async function clearCachedProfile(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(cacheKey(userId));
  } catch {
    // Non-blocking
  }
}
