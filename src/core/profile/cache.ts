import { secureSessionStorage } from '@/core/supabase/secureStorage';
import type { Profile } from '@/types/database';

function cacheKey(userId: string) {
  return `tanlabs.profile.cache.${userId}`;
}

export async function readCachedProfile(userId: string): Promise<Profile | null> {
  try {
    const raw = await secureSessionStorage.getItem(cacheKey(userId));
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
    await secureSessionStorage.setItem(cacheKey(userId), JSON.stringify(profile));
  } catch {
    // Non-blocking cache write
  }
}

export async function clearCachedProfile(userId: string): Promise<void> {
  try {
    await secureSessionStorage.removeItem(cacheKey(userId));
  } catch {
    // Non-blocking
  }
}
