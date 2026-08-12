import { Platform } from 'react-native';

function crashlyticsMod() {
  return require('@react-native-firebase/crashlytics') as typeof import('@react-native-firebase/crashlytics');
}

export async function initializeMonitoring(): Promise<void> {
  try {
    const { getCrashlytics, setAttribute, setCrashlyticsCollectionEnabled } = crashlyticsMod();
    const crashlytics = getCrashlytics();
    await setCrashlyticsCollectionEnabled(crashlytics, true);
    await setAttribute(crashlytics, 'platform', Platform.OS);
    await setAttribute(crashlytics, 'app_version', '0.0.1');
    await setAttribute(crashlytics, 'build', String(1));
  } catch {
    // Non-blocking
  }
}

export async function setMonitoringAttribute(key: string, value: string): Promise<void> {
  try {
    const { getCrashlytics, setAttribute } = crashlyticsMod();
    await setAttribute(getCrashlytics(), key, value);
  } catch {
    // Non-blocking
  }
}

/** Bounded Grammar context only — never answers, email, or free text. */
export async function setGrammarMonitoringContext(input: {
  route?: string;
  lessonSlug?: string | null;
}): Promise<void> {
  await setMonitoringAttribute('current_feature', 'grammar');
  if (input.route) {
    await setMonitoringAttribute('grammar_route', input.route.slice(0, 64));
  }
  if (input.lessonSlug) {
    await setMonitoringAttribute('grammar_lesson_slug', input.lessonSlug.slice(0, 64));
  } else if (input.lessonSlug === null) {
    await setMonitoringAttribute('grammar_lesson_slug', '');
  }
}

export async function clearGrammarMonitoringContext(): Promise<void> {
  await setMonitoringAttribute('current_feature', '');
  await setMonitoringAttribute('grammar_route', '');
  await setMonitoringAttribute('grammar_lesson_slug', '');
}

export async function recordError(error: unknown): Promise<void> {
  try {
    const { getCrashlytics, recordError: recordCrashlyticsError } = crashlyticsMod();
    const crashlytics = getCrashlytics();
    if (error instanceof Error) {
      recordCrashlyticsError(crashlytics, error);
    } else {
      recordCrashlyticsError(crashlytics, new Error(String(error)));
    }
  } catch {
    if (__DEV__) {
      console.warn('[crashlytics]', error);
    }
  }
}

/** Dev-only controlled crash for Console verification (Batch 6). */
export function triggerTestCrash(): void {
  if (!__DEV__) {
    return;
  }
  try {
    const { crash, getCrashlytics } = crashlyticsMod();
    crash(getCrashlytics());
  } catch (error) {
    console.warn('[crashlytics] test crash failed', error);
  }
}
