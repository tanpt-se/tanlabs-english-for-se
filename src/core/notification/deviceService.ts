import { Platform } from 'react-native';

import { supabase } from '@/core/supabase/client';
import { secureSessionStorage } from '@/core/supabase/secureStorage';

const TOKEN_STORAGE_KEY = 'tanlabs.fcm.device_token';

let memoryToken: string | null = null;

async function readStoredToken(): Promise<string | null> {
  if (memoryToken) {
    return memoryToken;
  }
  try {
    const stored = await secureSessionStorage.getItem(TOKEN_STORAGE_KEY);
    memoryToken = stored;
    return stored;
  } catch {
    return null;
  }
}

async function writeStoredToken(token: string | null): Promise<void> {
  memoryToken = token;
  try {
    if (token) {
      await secureSessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      await secureSessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Non-blocking local cache write.
  }
}

function asError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error(fallback);
}

export async function getDevicePushToken(): Promise<string | null> {
  return readStoredToken();
}

export function setDevicePushTokenForTests(token: string | null) {
  memoryToken = token;
}

export async function clearDevicePushToken(): Promise<void> {
  await writeStoredToken(null);
}

/**
 * Persist token for the signed-in user and claim ownership from any prior account
 * (via SECURITY DEFINER RPC — see migration 005).
 */
export async function persistDeviceToken(_userId: string, token: string) {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  const { error: claimError } = await supabase.rpc('claim_device_token', {
    p_token: token,
    p_platform: platform,
  });

  if (claimError) {
    throw asError(claimError, 'Failed to claim device token');
  }

  await writeStoredToken(token);
}

/**
 * Deactivate this device for the current user. Uses persisted token (survives cold start).
 * Also deactivates all active rows for the user so logout is reliable even if token refresh raced.
 * Throws if Supabase reports an error (callers may still continue sign-out after recording).
 */
export async function deactivateCurrentDevice() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    throw asError(userError, 'Failed to resolve user for device deactivate');
  }
  if (!user) {
    return;
  }

  const token = await readStoredToken();
  const failures: string[] = [];

  if (token) {
    const { error } = await supabase
      .from('user_devices')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('fcm_token', token);
    if (error) {
      failures.push(asError(error, 'token deactivate failed').message);
    }
  }

  const { error: activeError } = await supabase
    .from('user_devices')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);
  if (activeError) {
    failures.push(asError(activeError, 'active-row deactivate failed').message);
  }

  if (failures.length > 0) {
    throw new Error(`Device deactivate failed: ${failures.join('; ')}`);
  }
}
