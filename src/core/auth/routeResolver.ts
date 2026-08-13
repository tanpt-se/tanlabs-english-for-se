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
};

/**
 * Resolves the next navigation destination from session + profile completeness.
 */
export function resolveAuthRoute(input: AuthRouteInput): RouteDestination {
  if (!input.hasSession) {
    return 'auth';
  }
  if (input.passwordRecovery) {
    return 'setPassword';
  }
  if (input.profileCompleteness === 'incomplete') {
    return 'completeProfile';
  }
  return 'app';
}
