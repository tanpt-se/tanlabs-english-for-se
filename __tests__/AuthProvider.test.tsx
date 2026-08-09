import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { AuthProvider, useAuth } from '@/core/auth/AuthProvider';
import { getSession } from '@/core/auth/service';
import { fetchProfile } from '@/core/profile/service';
import type { Profile } from '@/types/database';

import type { Session } from '@supabase/supabase-js';

let mockAuthListener: ((event: string, session: Session | null) => void) | undefined;

jest.mock('@/core/auth/service', () => ({
  getSession: jest.fn(),
  signOut: jest.fn(async () => undefined),
}));

jest.mock('@/core/profile/cache', () => ({
  clearCachedProfile: jest.fn(async () => undefined),
  readCachedProfile: jest.fn(async () => null),
  writeCachedProfile: jest.fn(async () => undefined),
}));

jest.mock('@/core/profile/service', () => ({
  fetchProfile: jest.fn(),
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
  const { profile: currentProfile } = useAuth();
  return <>{currentProfile?.id ?? 'none'}</>;
}

test('ignores a stale profile response after the signed-in user changes', async () => {
  const firstProfile = deferred<Profile | null>();
  jest.mocked(getSession).mockResolvedValue(session('user-a'));
  jest
    .mocked(fetchProfile)
    .mockImplementationOnce(() => firstProfile.promise)
    .mockResolvedValueOnce(profile('user-b'));

  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await Promise.resolve();
  });

  await ReactTestRenderer.act(async () => {
    mockAuthListener?.('SIGNED_IN', session('user-b'));
    await Promise.resolve();
  });

  firstProfile.resolve(profile('user-a'));
  await ReactTestRenderer.act(async () => {
    await firstProfile.promise;
  });

  expect(renderer.toJSON()).toBe('user-b');
});
