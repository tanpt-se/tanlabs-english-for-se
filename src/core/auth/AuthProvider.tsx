import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { resolveAuthRoute } from '@/core/auth/routeResolver';
import type { ProfileCompleteness, RouteDestination } from '@/core/auth/routeResolver';
import { getSession, signOut as authSignOut } from '@/core/auth/service';
import { deactivateCurrentDevice } from '@/core/notification/deviceService';
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from '@/core/profile/cache';
import { fetchProfile } from '@/core/profile/service';
import { supabase } from '@/core/supabase/client';
import { clearPersistedQueryCache } from '@/lib/queryClient';
import type { Profile } from '@/types/database';

import type { Session, User } from '@supabase/supabase-js';
import type { PropsWithChildren } from 'react';

type AuthContextValue = {
  bootstrapped: boolean;
  /** False only while resolving profile after an account change (avoids CompleteProfile flash). */
  profileSettled: boolean;
  destination: RouteDestination;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  session: Session | null;
  signOut: () => Promise<void>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileCompleteness, setProfileCompleteness] = useState<ProfileCompleteness>('unknown');
  const [profileSettled, setProfileSettled] = useState(true);
  const profileRequestId = useRef(0);
  const loadedUserId = useRef<string | undefined>(undefined);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    const requestId = ++profileRequestId.current;
    const isCurrentRequest = () => requestId === profileRequestId.current;

    if (!userId) {
      loadedUserId.current = undefined;
      setProfile(null);
      setProfileCompleteness('incomplete');
      setProfileSettled(true);
      return;
    }

    const userChanged = loadedUserId.current !== userId;
    // Only block routing on account change — same-user refresh must not remount navigators.
    if (userChanged) {
      setProfileSettled(false);
    }

    const cached = await readCachedProfile(userId);
    if (!isCurrentRequest()) {
      return;
    }
    if (cached) {
      setProfile(cached);
      setProfileCompleteness('complete');
    } else if (userChanged) {
      setProfileCompleteness('unknown');
    }

    try {
      const next = await fetchProfile(userId);
      if (!isCurrentRequest()) {
        return;
      }
      if (next) {
        setProfile(next);
        setProfileCompleteness('complete');
        await writeCachedProfile(userId, next);
        return;
      }
      setProfile(null);
      setProfileCompleteness('incomplete');
      await clearCachedProfile(userId);
    } catch {
      if (!isCurrentRequest()) {
        return;
      }
      if (cached) {
        setProfile(cached);
        setProfileCompleteness('complete');
        return;
      }
      setProfileCompleteness('unknown');
    } finally {
      if (isCurrentRequest()) {
        loadedUserId.current = userId;
        setProfileSettled(true);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user.id);
  }, [loadProfile, session?.user.id]);

  const signOut = useCallback(async () => {
    const userId = session?.user.id;
    try {
      // Must run while session is still valid (RLS).
      await deactivateCurrentDevice();
    } catch {
      // Non-blocking — still sign out locally.
    }
    await authSignOut();
    if (userId) {
      await clearCachedProfile(userId);
    }
    await clearPersistedQueryCache();
    setProfile(null);
    setProfileCompleteness('incomplete');
    setProfileSettled(true);
    loadedUserId.current = undefined;
  }, [session?.user.id]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const current = await getSession();
        if (!mounted) {
          return;
        }
        setSession(current);
        await loadProfile(current?.user.id);
      } finally {
        if (mounted) {
          setBootstrapped(true);
        }
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession?.user.id).catch(() => undefined);
      if (nextSession?.user.id) {
        import('@/core/notification/fcm')
          .then(({ syncNotificationsForSignedInUser }) =>
            syncNotificationsForSignedInUser(nextSession.user.id),
          )
          .catch(() => undefined);
      }
      if (event === 'SIGNED_OUT') {
        loadedUserId.current = undefined;
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const destination = useMemo(
    () =>
      resolveAuthRoute({
        hasSession: Boolean(session),
        profileCompleteness,
      }),
    [profileCompleteness, session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      bootstrapped,
      profileSettled,
      destination,
      profile,
      refreshProfile,
      session,
      signOut,
      user: session?.user ?? null,
    }),
    [bootstrapped, destination, profile, profileSettled, refreshProfile, session, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
