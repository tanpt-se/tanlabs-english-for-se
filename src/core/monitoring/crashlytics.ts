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
