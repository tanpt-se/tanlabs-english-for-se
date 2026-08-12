type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

const ALLOWED = new Set([
  'app_open',
  'register_success',
  'login_success',
  'profile_completed',
  'notification_enabled',
  'notification_disabled',
  'logout',
  'grammar_opened',
  'grammar_topic_opened',
  'grammar_lesson_started',
  'grammar_lesson_completed',
  'grammar_practice_started',
  'grammar_practice_completed',
  'grammar_practice_retry',
]);

const GRAMMAR_EVENTS = new Set([
  'grammar_opened',
  'grammar_topic_opened',
  'grammar_lesson_started',
  'grammar_lesson_completed',
  'grammar_practice_started',
  'grammar_practice_completed',
  'grammar_practice_retry',
]);

const GRAMMAR_PARAM_KEYS = new Set(['topic_slug', 'lesson_slug', 'score_bucket']);

function sanitizeParams(
  name: string,
  params?: AnalyticsPayload,
): Record<string, string | number> | undefined {
  if (!params) {
    return undefined;
  }
  const out: Record<string, string | number> = {};
  const grammarOnly = GRAMMAR_EVENTS.has(name);

  for (const [key, value] of Object.entries(params)) {
    // Never forward free-text / English practice content.
    if (key === 'text' || key === 'display_name' || key === 'email' || key === 'password') {
      continue;
    }
    if (grammarOnly && !GRAMMAR_PARAM_KEYS.has(key)) {
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
  const safeParams = sanitizeParams(name, params);
  try {
    const { getAnalytics, logEvent } = analyticsMod();
    await logEvent(getAnalytics(), name, safeParams);
  } catch {
    if (__DEV__) {
      console.log('[analytics]', name, safeParams);
    }
  }
}
