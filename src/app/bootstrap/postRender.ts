import { trackEvent } from '@/core/analytics/events';
import { initializeMonitoring } from '@/core/monitoring/crashlytics';
import { initializeNotifications } from '@/core/notification/fcm';

/** Non-blocking post-render bootstrap for Wave 2 services. */
export async function runPostRenderBootstrap() {
  try {
    await Promise.allSettled([initializeMonitoring(), initializeNotifications()]);
    await trackEvent('app_open');
  } catch {
    // Never block UI
  }
}
