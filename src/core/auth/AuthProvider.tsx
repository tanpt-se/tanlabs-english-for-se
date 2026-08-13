import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking } from 'react-native';

import { isAuthResetDeepLink } from '@/core/auth/deepLink';
import { resolveAuthRoute } from '@/core/auth/routeResolver';
import type { ProfileCompleteness, RouteDestination } from '@/core/auth/routeResolver';
import { getSession, signOut as authSignOut, verifyRecoveryFromUrl } from '@/core/auth/service';
import { clearGrammarMonitoringContext, recordError } from '@/core/monitoring/crashlytics';
import { deactivateCurrentDevice } from '@/core/notification/deviceService';
import { deleteCurrentFcmToken, syncNotificationsForSignedInUser } from '@/core/notification/fcm';
import { clearCachedProfile, readCachedProfile, writeCachedProfile } from '@/core/profile/cache';
import { fetchProfile } from '@/core/profile/service';
import { supabase } from '@/core/supabase/client';
import { clearPersistedQueryCache } from '@/lib/queryClient';
import type { Profile } from '@/types/database';

import type { Session, User } from '@supabase/supabase-js';
import type { PropsWithChildren } from 'react';

type AuthContextValue = {
  bootstrapped: boolean;
  clearPasswordRecovery: () => void;
  clearRecoveryLinkError: () => void;
  /** False only while resolving profile after an account change (avoids CompleteProfile flash). */
  profileSettled: boolean;
  destination: RouteDestination;
  profile: Profile | null;
  recoveryLinkError: string | null;
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
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [recoveryLinkError, setRecoveryLinkError] = useState<string | null>(null);
  const profileRequestId = useRef(0);
  const loadedUserId = useRef<string | undefined>(undefined);

  const clearPasswordRecovery = useCallback(() => {
    setPasswordRecovery(false);
  }, []);

  const clearRecoveryLinkError = useCallback(() => {
    setRecoveryLinkError(null);
  }, []);

  const consumeRecoveryUrl = useCallback(async (url: string | null) => {
    if (!url || !isAuthResetDeepLink(url)) {
      return;
    }
    try {
      await verifyRecoveryFromUrl(url);
      setRecoveryLinkError(null);
      setPasswordRecovery(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid or expired reset link.';
      setRecoveryLinkError(message);
      await recordError(err instanceof Error ? err : new Error(message));
    }
  }, []);

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
    const revocations = await Promise.allSettled([
      deactivateCurrentDevice(),
      deleteCurrentFcmToken(),
    ]);
    const failures = revocations.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      await recordError(
        new Error(
          failures
            .map((result) => (result.status === 'rejected' ? String(result.reason) : ''))
            .join('; '),
        ),
      );
    }
    await authSignOut();
    if (userId) {
      await clearCachedProfile(userId);
    }
    await clearPersistedQueryCache();
    await clearGrammarMonitoringContext().catch(() => undefined);
    setProfile(null);
    setProfileCompleteness('incomplete');
    setProfileSettled(true);
    setPasswordRecovery(false);
    setRecoveryLinkError(null);
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
        await consumeRecoveryUrl(await Linking.getInitialURL());
      } finally {
        if (mounted) {
          setBootstrapped(true);
        }
      }
    })();

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      consumeRecoveryUrl(url).catch((err) => {
        recordError(err instanceof Error ? err : new Error(String(err))).catch(() => undefined);
      });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
        setRecoveryLinkError(null);
      }
      if (event === 'SIGNED_OUT') {
        loadedUserId.current = undefined;
        setPasswordRecovery(false);
        setRecoveryLinkError(null);
      }
      loadProfile(nextSession?.user.id).catch(() => undefined);
      if (nextSession?.user.id) {
        syncNotificationsForSignedInUser(nextSession.user.id).catch(() => undefined);
      }
    });

    return () => {
      mounted = false;
      linkingSubscription.remove();
      subscription.subscription.unsubscribe();
    };
  }, [consumeRecoveryUrl, loadProfile]);

  const destination = useMemo(
    () =>
      resolveAuthRoute({
        hasSession: Boolean(session),
        passwordRecovery,
        profileCompleteness,
      }),
    [passwordRecovery, profileCompleteness, session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      bootstrapped,
      clearPasswordRecovery,
      clearRecoveryLinkError,
      profileSettled,
      destination,
      profile,
      recoveryLinkError,
      refreshProfile,
      session,
      signOut,
      user: session?.user ?? null,
    }),
    [
      bootstrapped,
      clearPasswordRecovery,
      clearRecoveryLinkError,
      destination,
      profile,
      profileSettled,
      recoveryLinkError,
      refreshProfile,
      session,
      signOut,
    ],
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
