import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tanlabs/password_recovery_pending_v1';

type StoredPending = {
  at: number;
  userId: string;
};

function parseStored(raw: string | null): StoredPending | null {
  if (!raw || raw === '1') {
    // Legacy boolean / malformed payloads are ignored so upgrades cannot trap users.
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPending>;
    if (
      typeof parsed.at === 'number' &&
      Number.isFinite(parsed.at) &&
      typeof parsed.userId === 'string' &&
      parsed.userId.length > 0
    ) {
      return { at: parsed.at, userId: parsed.userId };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Persist recovery mode so cold starts still force Set New Password.
 * Bound to userId and cleared on sign-out / successful login / no-session bootstrap.
 * No TTL: Supabase recovery sessions can outlive a short window.
 */
export async function readPasswordRecoveryPending(userId?: string | null): Promise<boolean> {
  try {
    const stored = parseStored(await AsyncStorage.getItem(STORAGE_KEY));
    if (!stored) {
      return false;
    }
    if (!userId || stored.userId !== userId) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function writePasswordRecoveryPending(
  pending: boolean,
  userId?: string | null,
): Promise<void> {
  try {
    if (pending) {
      if (!userId) {
        // Refuse to persist an unbound recovery flag that could attach to another account.
        await AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }
      const payload: StoredPending = {
        at: Date.now(),
        userId,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return;
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort — in-memory flag still applies for the current process.
  }
}
