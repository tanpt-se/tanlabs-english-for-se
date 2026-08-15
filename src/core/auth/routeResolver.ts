export type RouteDestination = 'auth' | 'completeProfile' | 'app' | 'setPassword';

/**
 * `unknown` = session exists but profile completeness could not be confirmed
 * (e.g. offline fetch failure without a local cache). Prefer app shell over
 * forcing Complete Profile.
 */
export type ProfileCompleteness = 'complete' | 'incomplete' | 'unknown';

export type AuthRouteInput = {
  hasSession: boolean;
  passwordRecovery: boolean;
  profileCompleteness: ProfileCompleteness;
  /** Invalid/expired reset link — force auth shell so Login can show the message. */
  recoveryLinkError?: boolean;
};

/**
 * Resolves the next navigation destination from session + profile completeness.
 */
export function resolveAuthRoute(input: AuthRouteInput): RouteDestination {
  // Active recovery wins over a stale/failed reset-link error so cold starts
  // still force Set New Password when a recovery session is pending.
  if (input.passwordRecovery) {
    return 'setPassword';
  }
  if (input.recoveryLinkError) {
    return 'auth';
  }
  if (!input.hasSession) {
    return 'auth';
  }
  if (input.profileCompleteness === 'incomplete') {
    return 'completeProfile';
  }
  return 'app';
}
