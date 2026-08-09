import { resolveAuthRoute } from '@/core/auth/routeResolver';

describe('resolveAuthRoute', () => {
  it('routes to auth when there is no session', () => {
    expect(resolveAuthRoute({ hasSession: false, profileCompleteness: 'incomplete' })).toBe('auth');
  });

  it('routes to completeProfile when session exists without profile', () => {
    expect(resolveAuthRoute({ hasSession: true, profileCompleteness: 'incomplete' })).toBe(
      'completeProfile',
    );
  });

  it('routes to app when session and profile exist', () => {
    expect(resolveAuthRoute({ hasSession: true, profileCompleteness: 'complete' })).toBe('app');
  });

  it('routes to app when profile completeness is unknown (offline-safe)', () => {
    expect(resolveAuthRoute({ hasSession: true, profileCompleteness: 'unknown' })).toBe('app');
  });
});
