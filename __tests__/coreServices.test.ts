import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import { getSession, signIn, signOut, signUp } from '@/core/auth/service';
import {
  fetchNotificationSettings,
  setNotificationEnabled,
} from '@/core/notification/settingsService';
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from '@/core/profile/cache';
import { fetchProfile, upsertProfile } from '@/core/profile/service';
import { DEFAULT_FEATURE_FLAGS, fetchFeatureFlags } from '@/core/remote-config/service';
import { supabase } from '@/core/supabase/client';
import type { Profile } from '@/types/database';

jest.mock('@/core/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const profile: Profile = {
  created_at: '2026-08-09T00:00:00.000Z',
  display_name: 'Profile A',
  english_level: 'B2',
  id: 'user-1',
  updated_at: '2026-08-09T00:00:00.000Z',
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  (Keychain as typeof Keychain & { __reset: () => void }).__reset();
});

test('auth service trims email and returns Supabase data', async () => {
  jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
    data: { session: null, user: null },
    error: null,
  } as never);
  jest.mocked(supabase.auth.signUp).mockResolvedValue({
    data: { session: null, user: null },
    error: null,
  });

  await signIn(' user@example.com ', 'password');
  await signUp(' user@example.com ', 'password');

  expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'password',
  });
  expect(supabase.auth.signUp).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'password',
  });
});

test('auth service maps failures and resolves session lifecycle', async () => {
  jest.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
    data: { session: null, user: null },
    error: { message: 'Invalid login credentials' } as never,
  });
  await expect(signIn('user@example.com', 'bad')).rejects.toThrow('Invalid email or password.');

  jest.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: null },
    error: null,
  });
  await expect(getSession()).resolves.toBeNull();

  jest.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
  await expect(signOut()).resolves.toBeUndefined();
});

test('profile service fetches and validates profile writes', async () => {
  const maybeSingle = jest.fn(async () => ({ data: profile, error: null }));
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  jest.mocked(supabase.from).mockReturnValueOnce({ select } as never);

  await expect(fetchProfile('user-1')).resolves.toEqual(profile);
  expect(eq).toHaveBeenCalledWith('id', 'user-1');
  await expect(
    upsertProfile({ userId: 'user-1', displayName: 'x', englishLevel: 'B2' }),
  ).rejects.toThrow('Display name must be at least 2 characters.');
});

test('profile service trims and persists valid profile input', async () => {
  const single = jest.fn(async () => ({ data: profile, error: null }));
  const select = jest.fn(() => ({ single }));
  const upsert = jest.fn(() => ({ select }));
  jest.mocked(supabase.from).mockReturnValue({ upsert } as never);

  await expect(
    upsertProfile({ userId: 'user-1', displayName: ' Profile A ', englishLevel: 'B2' }),
  ).resolves.toEqual(profile);
  expect(upsert).toHaveBeenCalledWith({
    display_name: 'Profile A',
    english_level: 'B2',
    id: 'user-1',
  });
});

test('notification settings service reads and writes the current user row', async () => {
  const settings = { enabled: true, updated_at: profile.updated_at, user_id: 'user-1' };
  const readSingle = jest.fn(async () => ({ data: settings, error: null }));
  const eq = jest.fn(() => ({ maybeSingle: readSingle }));
  jest.mocked(supabase.from).mockReturnValueOnce({ select: jest.fn(() => ({ eq })) } as never);

  await expect(fetchNotificationSettings('user-1')).resolves.toEqual(settings);

  const writeSingle = jest.fn(async () => ({ data: settings, error: null }));
  const select = jest.fn(() => ({ single: writeSingle }));
  const upsert = jest.fn(() => ({ select }));
  jest.mocked(supabase.from).mockReturnValueOnce({ upsert } as never);

  await expect(setNotificationEnabled('user-1', true)).resolves.toEqual(settings);
  expect(upsert).toHaveBeenCalledWith({ enabled: true, user_id: 'user-1' });
});

test('remote config returns parsed values and safe defaults on failure', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.mocked(supabase.from).mockReturnValueOnce({
    select: jest.fn(async () => ({
      data: [{ key: 'feature_grammar', value: true }],
      error: null,
    })),
  } as never);
  await expect(fetchFeatureFlags()).resolves.toEqual({
    ...DEFAULT_FEATURE_FLAGS,
    grammar: true,
  });

  jest.mocked(supabase.from).mockReturnValueOnce({
    select: jest.fn(async () => ({ data: null, error: new Error('offline') })),
  } as never);
  await expect(fetchFeatureFlags()).resolves.toEqual(DEFAULT_FEATURE_FLAGS);
  expect(warn).toHaveBeenCalledWith('[remote-config] using defaults', expect.any(Error));
  warn.mockRestore();
});

test('profile cache round-trips through secure storage', async () => {
  await writeCachedProfile('user-1', profile);
  await expect(readCachedProfile('user-1')).resolves.toEqual(profile);
  await expect(AsyncStorage.getItem('tanlabs.profile.cache.user-1')).resolves.toBeNull();

  await clearCachedProfile('user-1');
  await expect(readCachedProfile('user-1')).resolves.toBeNull();
});
