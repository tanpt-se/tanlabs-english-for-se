import { resolveAuthRoute } from '@/core/auth/routeResolver';

describe('resolveAuthRoute', () => {
  it('routes to auth when there is no session', () => {
    expect(
      resolveAuthRoute({
        hasSession: false,
        passwordRecovery: false,
        profileCompleteness: 'incomplete',
      }),
    ).toBe('auth');
  });

  it('routes to setPassword when recovery session is active', () => {
    expect(
      resolveAuthRoute({
        hasSession: true,
        passwordRecovery: true,
        profileCompleteness: 'complete',
      }),
    ).toBe('setPassword');
  });

  it('routes to completeProfile when session exists without profile', () => {
    expect(
      resolveAuthRoute({
        hasSession: true,
        passwordRecovery: false,
        profileCompleteness: 'incomplete',
      }),
    ).toBe('completeProfile');
  });

  it('routes to app when session and profile exist', () => {
    expect(
      resolveAuthRoute({
        hasSession: true,
        passwordRecovery: false,
        profileCompleteness: 'complete',
      }),
    ).toBe('app');
  });

  it('routes to app when profile completeness is unknown (offline-safe)', () => {
    expect(
      resolveAuthRoute({
        hasSession: true,
        passwordRecovery: false,
        profileCompleteness: 'unknown',
      }),
    ).toBe('app');
  });
});
