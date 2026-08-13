import { AUTH_RESET_URL, isAuthResetDeepLink, parseRecoveryLinkParams } from '@/core/auth/deepLink';

describe('auth deep links', () => {
  it('parses token_hash from query string', () => {
    expect(parseRecoveryLinkParams(`${AUTH_RESET_URL}?token_hash=abc123&type=recovery`)).toEqual({
      tokenHash: 'abc123',
      type: 'recovery',
    });
  });

  it('merges query and hash with hash winning on conflicts', () => {
    expect(
      parseRecoveryLinkParams(
        `${AUTH_RESET_URL}?access_token=query&token_hash=from-query#access_token=hash&type=recovery`,
      ),
    ).toEqual({
      accessToken: 'hash',
      tokenHash: 'from-query',
      type: 'recovery',
    });
  });

  it('returns empty params for bare reset URL', () => {
    expect(parseRecoveryLinkParams(AUTH_RESET_URL)).toEqual({});
    expect(parseRecoveryLinkParams(`${AUTH_RESET_URL}?`)).toEqual({});
  });

  it('decodes plus-encoded values', () => {
    expect(parseRecoveryLinkParams(`${AUTH_RESET_URL}?token_hash=a+b`)).toEqual({
      tokenHash: 'a b',
    });
  });

  it('parses access tokens from hash fragment', () => {
    expect(
      parseRecoveryLinkParams(`${AUTH_RESET_URL}#access_token=at&refresh_token=rt&type=recovery`),
    ).toEqual({
      accessToken: 'at',
      refreshToken: 'rt',
      type: 'recovery',
    });
  });

  it('detects reset deep links for query and hash', () => {
    expect(isAuthResetDeepLink(`${AUTH_RESET_URL}?token_hash=x`)).toBe(true);
    expect(isAuthResetDeepLink(`${AUTH_RESET_URL}#access_token=at&refresh_token=rt`)).toBe(true);
    expect(isAuthResetDeepLink(AUTH_RESET_URL)).toBe(true);
    expect(isAuthResetDeepLink('https://example.com')).toBe(false);
    expect(isAuthResetDeepLink('tanlabs://auth/login')).toBe(false);
  });

  it('falls back to prefix match when URL parsing fails', () => {
    const RealURL = global.URL;
    global.URL = class extends RealURL {
      constructor(input: string) {
        if (input.includes('force-fallback')) {
          throw new TypeError('invalid');
        }
        super(input);
      }
    } as typeof URL;

    try {
      expect(isAuthResetDeepLink(`${AUTH_RESET_URL}?force-fallback=1`)).toBe(true);
      expect(isAuthResetDeepLink(`${AUTH_RESET_URL}#force-fallback=1`)).toBe(true);
      expect(isAuthResetDeepLink('https://example.com/force-fallback')).toBe(false);
    } finally {
      global.URL = RealURL;
    }
  });
});
