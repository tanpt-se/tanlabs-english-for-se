type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

const ALLOWED = new Set([
  'app_open',
  'register_success',
  'login_success',
  'profile_completed',
  'notification_enabled',
  'notification_disabled',
  'logout',
]);

function sanitizeParams(params?: AnalyticsPayload): Record<string, string | number> | undefined {
  if (!params) {
    return undefined;
  }
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    // Never forward free-text / English practice content.
    if (key === 'text' || key === 'display_name' || key === 'email' || key === 'password') {
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      out[key] = value;
    } else if (typeof value === 'boolean') {
      out[key] = value ? 1 : 0;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function analyticsMod() {
  return require('@react-native-firebase/analytics') as typeof import('@react-native-firebase/analytics');
}

export async function trackEvent(name: string, params?: AnalyticsPayload): Promise<void> {
  if (!ALLOWED.has(name)) {
    return;
  }
  const safeParams = sanitizeParams(params);
  try {
    const { getAnalytics, logEvent } = analyticsMod();
    await logEvent(getAnalytics(), name, safeParams);
  } catch {
    if (__DEV__) {
      console.log('[analytics]', name, safeParams);
    }
  }
}

export { recordFatalError } from '@/core/monitoring/crashlytics';
