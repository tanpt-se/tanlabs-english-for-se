/** Supabase password-reset redirect target — register in Dashboard → Auth → Redirect URLs. */
export const AUTH_RESET_URL = 'tanlabs://auth/reset';

export type RecoveryLinkParams = {
  accessToken?: string;
  refreshToken?: string;
  tokenHash?: string;
  type?: string;
};

function parseParamPairs(searchOrHash: string): Record<string, string> {
  const normalized =
    searchOrHash.startsWith('?') || searchOrHash.startsWith('#')
      ? searchOrHash.slice(1)
      : searchOrHash;
  if (!normalized) {
    return {};
  }
  return normalized.split('&').reduce<Record<string, string>>((acc, pair) => {
    const [rawKey, rawValue = ''] = pair.split('=');
    if (!rawKey) {
      return acc;
    }
    acc[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.replace(/\+/g, ' '));
    return acc;
  }, {});
}

/** Parses Supabase recovery links (query or hash fragments). */
export function parseRecoveryLinkParams(url: string): RecoveryLinkParams {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const hashParams = hashIndex >= 0 ? parseParamPairs(url.slice(hashIndex)) : {};
  const queryParams =
    queryIndex >= 0
      ? parseParamPairs(url.slice(queryIndex, hashIndex >= 0 ? hashIndex : undefined))
      : {};

  const merged = { ...queryParams, ...hashParams };

  return {
    accessToken: merged.access_token,
    refreshToken: merged.refresh_token,
    tokenHash: merged.token_hash,
    type: merged.type,
  };
}

export function isAuthResetDeepLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'tanlabs:' && parsed.hostname === 'auth' && parsed.pathname === '/reset'
    );
  } catch {
    return url.startsWith(`${AUTH_RESET_URL}?`) || url.startsWith(`${AUTH_RESET_URL}#`);
  }
}
