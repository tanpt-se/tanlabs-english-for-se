import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AuthProvider, useAuth } from '@/core/auth/AuthProvider';
import { getSession, signOut as authSignOut, verifyRecoveryFromUrl } from '@/core/auth/service';
import { recordError } from '@/core/monitoring/crashlytics';
import { deactivateCurrentDevice } from '@/core/notification/deviceService';
import { deleteCurrentFcmToken, syncNotificationsForSignedInUser } from '@/core/notification/fcm';
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from '@/core/profile/cache';
import { fetchProfile } from '@/core/profile/service';
import type { Profile } from '@/types/database';

import type { Session } from '@supabase/supabase-js';

let mockAuthListener: ((event: string, session: Session | null) => void) | undefined;
let latestAuth: ReturnType<typeof useAuth> | undefined;

jest.mock('@/core/auth/service', () => ({
  getSession: jest.fn(),
  signOut: jest.fn(async () => undefined),
  verifyRecoveryFromUrl: jest.fn(async () => undefined),
}));

jest.mock('@/core/profile/cache', () => ({
  clearCachedProfile: jest.fn(async () => undefined),
  readCachedProfile: jest.fn(async () => null),
  writeCachedProfile: jest.fn(async () => undefined),
}));

jest.mock('@/core/profile/service', () => ({
  fetchProfile: jest.fn(),
}));

jest.mock('@/core/notification/deviceService', () => ({
  deactivateCurrentDevice: jest.fn(async () => undefined),
}));

jest.mock('@/core/notification/fcm', () => ({
  deleteCurrentFcmToken: jest.fn(async () => undefined),
  syncNotificationsForSignedInUser: jest.fn(async () => undefined),
}));

jest.mock('@/core/monitoring/crashlytics', () => ({
  recordError: jest.fn(async () => undefined),
  clearGrammarMonitoringContext: jest.fn(async () => undefined),
}));

jest.mock('@/core/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn((listener) => {
        mockAuthListener = listener;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
    },
  },
}));

jest.mock('@/lib/queryClient', () => ({
  clearPersistedQueryCache: jest.fn(async () => undefined),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function session(userId: string): Session {
  return { user: { id: userId } } as Session;
}

function profile(userId: string): Profile {
  return {
    created_at: '',
    display_name: userId,
    english_level: 'B1',
    id: userId,
    updated_at: '',
  };
}

function Probe() {
  latestAuth = useAuth();
  return <>{latestAuth.profile?.id ?? latestAuth.destination}</>;
}

async function mountProvider() {
  let root!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    root = ReactTestRenderer.create(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await Promise.resolve();
    await Promise.resolve();
  });
  return root;
}

beforeEach(() => {
  jest.clearAllMocks();
  latestAuth = undefined;
  mockAuthListener = undefined;
  jest.mocked(readCachedProfile).mockResolvedValue(null);
  jest.mocked(getSession).mockResolvedValue(null);
  jest.mocked(fetchProfile).mockResolvedValue(null);
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  jest.spyOn(Linking, 'addEventListener').mockReturnValue({ remove: jest.fn() } as never);
});

test('ignores a stale profile response after the signed-in user changes', async () => {
  const firstProfile = deferred<Profile | null>();
  jest.mocked(getSession).mockResolvedValue(session('user-a'));
  jest
    .mocked(fetchProfile)
    .mockImplementationOnce(() => firstProfile.promise)
    .mockResolvedValueOnce(profile('user-b'));

  const renderer = await mountProvider();

  await act(async () => {
    mockAuthListener?.('SIGNED_IN', session('user-b'));
    await Promise.resolve();
  });

  firstProfile.resolve(profile('user-a'));
  await act(async () => {
    await firstProfile.promise;
  });

  expect(renderer.toJSON()).toBe('user-b');
});

test('uses cached profile when fetch fails and clears cache when remote profile is missing', async () => {
  jest.mocked(getSession).mockResolvedValue(session('user-a'));
  jest.mocked(readCachedProfile).mockResolvedValue(profile('user-a'));
  jest.mocked(fetchProfile).mockRejectedValueOnce(new Error('offline'));

  await mountProvider();
  expect(latestAuth?.profile?.id).toBe('user-a');
  expect(latestAuth?.destination).toBe('app');

  jest.mocked(readCachedProfile).mockResolvedValue(null);
  jest.mocked(fetchProfile).mockResolvedValueOnce(null);
  await act(async () => {
    await latestAuth?.refreshProfile();
  });
  expect(clearCachedProfile).toHaveBeenCalledWith('user-a');
  expect(latestAuth?.destination).toBe('completeProfile');
});

test('writes remote profile into cache and syncs notifications on SIGNED_IN', async () => {
  jest.mocked(getSession).mockResolvedValue(null);
  await mountProvider();

  jest.mocked(fetchProfile).mockResolvedValue(profile('user-a'));
  await act(async () => {
    mockAuthListener?.('SIGNED_IN', session('user-a'));
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(writeCachedProfile).toHaveBeenCalledWith('user-a', profile('user-a'));
  expect(syncNotificationsForSignedInUser).toHaveBeenCalledWith('user-a');

  await act(async () => {
    mockAuthListener?.('SIGNED_OUT', null);
    await Promise.resolve();
  });
  expect(latestAuth?.destination).toBe('auth');
});

test('records revocation failures before signing out', async () => {
  jest.mocked(getSession).mockResolvedValue(session('user-a'));
  jest.mocked(fetchProfile).mockResolvedValue(profile('user-a'));
  jest.mocked(deactivateCurrentDevice).mockRejectedValueOnce(new Error('device fail'));
  jest.mocked(deleteCurrentFcmToken).mockRejectedValueOnce(new Error('fcm fail'));
  await mountProvider();

  await act(async () => {
    await latestAuth?.signOut();
  });

  expect(recordError).toHaveBeenCalled();
  expect(authSignOut).toHaveBeenCalled();
  expect(clearCachedProfile).toHaveBeenCalledWith('user-a');
});

test('marks profile unknown when fetch fails without cache', async () => {
  jest.mocked(getSession).mockResolvedValue(session('user-a'));
  jest.mocked(fetchProfile).mockRejectedValueOnce(new Error('offline'));
  await mountProvider();
  expect(latestAuth?.destination).toBe('app');
});

test('ignores bootstrap work after unmount and clears signed-out user id', async () => {
  const pending = deferred<Session | null>();
  jest.mocked(getSession).mockReturnValue(pending.promise);
  let root!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    root = ReactTestRenderer.create(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
  });
  await act(async () => {
    root.unmount();
  });
  pending.resolve(session('user-a'));
  await act(async () => {
    await pending.promise;
  });

  jest.mocked(getSession).mockResolvedValue(session('user-b'));
  jest.mocked(fetchProfile).mockResolvedValue(profile('user-b'));
  await mountProvider();
  await act(async () => {
    mockAuthListener?.('SIGNED_OUT', null);
    await Promise.resolve();
  });
  expect(latestAuth?.session).toBeNull();
});

test('routes to setPassword on PASSWORD_RECOVERY and clears after callback', async () => {
  jest.mocked(getSession).mockResolvedValue(session('user-a'));
  jest.mocked(fetchProfile).mockResolvedValue(profile('user-a'));
  await mountProvider();

  await act(async () => {
    mockAuthListener?.('PASSWORD_RECOVERY', session('user-a'));
    await Promise.resolve();
  });
  expect(latestAuth?.destination).toBe('setPassword');

  await act(async () => {
    latestAuth?.clearPasswordRecovery();
  });
  expect(latestAuth?.destination).toBe('app');
});

test('consumes recovery deep links on bootstrap', async () => {
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue('tanlabs://auth/reset?token_hash=abc&type=recovery');
  await mountProvider();
  expect(verifyRecoveryFromUrl).toHaveBeenCalledWith(
    'tanlabs://auth/reset?token_hash=abc&type=recovery',
  );
});

test('records recovery link failures and exposes message on auth context', async () => {
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue('tanlabs://auth/reset?token_hash=bad&type=recovery');
  jest.mocked(verifyRecoveryFromUrl).mockRejectedValueOnce(new Error('Reset link expired'));
  await mountProvider();
  expect(recordError).toHaveBeenCalled();
  expect(latestAuth?.recoveryLinkError).toBe('Reset link expired');
  expect(latestAuth?.destination).toBe('auth');
});
