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
import {
  readPasswordRecoveryPending,
  writePasswordRecoveryPending,
} from '@/core/auth/passwordRecoveryStore';
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
  clearPasswordRecovery: () => Promise<void>;
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
  const recoveryUrlInFlight = useRef<string | null>(null);
  const consumedRecoveryUrls = useRef(new Set<string>());

  const clearPasswordRecovery = useCallback(async () => {
    setPasswordRecovery(false);
    await writePasswordRecoveryPending(false);
  }, []);

  const markPasswordRecovery = useCallback(async (pending: boolean, userId?: string | null) => {
    setPasswordRecovery(pending);
    await writePasswordRecoveryPending(pending, userId);
  }, []);

  const clearRecoveryLinkError = useCallback(() => {
    setRecoveryLinkError(null);
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

  const consumeRecoveryUrl = useCallback(
    async (url: string | null) => {
      if (!url || !isAuthResetDeepLink(url)) {
        return;
      }
      if (consumedRecoveryUrls.current.has(url) || recoveryUrlInFlight.current === url) {
        return;
      }
      recoveryUrlInFlight.current = url;
      try {
        const data = await verifyRecoveryFromUrl(url);
        const nextSession = data.session ?? (await getSession());
        if (!nextSession) {
          setRecoveryLinkError('Invalid or expired reset link.');
          await markPasswordRecovery(false);
          return;
        }
        consumedRecoveryUrls.current.add(url);
        setSession(nextSession);
        await loadProfile(nextSession.user.id);
        setRecoveryLinkError(null);
        await markPasswordRecovery(true, nextSession.user.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid or expired reset link.';
        setRecoveryLinkError(message);
        const current = await getSession();
        const pending = current?.user.id
          ? await readPasswordRecoveryPending(current.user.id)
          : false;
        if (pending) {
          setPasswordRecovery(true);
        } else {
          await markPasswordRecovery(false);
        }
        await recordError(err instanceof Error ? err : new Error(message));
      } finally {
        if (recoveryUrlInFlight.current === url) {
          recoveryUrlInFlight.current = null;
        }
      }
    },
    [loadProfile, markPasswordRecovery],
  );

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
    await writePasswordRecoveryPending(false);
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
        if (!current) {
          // No session ⇒ recovery cannot be active; drop any leftover flag.
          await writePasswordRecoveryPending(false);
        } else {
          const pendingRecovery = await readPasswordRecoveryPending(current.user.id);
          if (mounted && pendingRecovery) {
            setPasswordRecovery(true);
          }
        }
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
        if (nextSession?.user.id) {
          markPasswordRecovery(true, nextSession.user.id).catch(() => undefined);
          setRecoveryLinkError(null);
        } else {
          setRecoveryLinkError('Invalid or expired reset link.');
          markPasswordRecovery(false).catch(() => undefined);
        }
      } else if (event === 'SIGNED_OUT') {
        loadedUserId.current = undefined;
        markPasswordRecovery(false).catch(() => undefined);
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
  }, [consumeRecoveryUrl, loadProfile, markPasswordRecovery]);

  const destination = useMemo(
    () =>
      resolveAuthRoute({
        hasSession: Boolean(session),
        passwordRecovery,
        profileCompleteness,
        recoveryLinkError: Boolean(recoveryLinkError),
      }),
    [passwordRecovery, profileCompleteness, recoveryLinkError, session],
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
