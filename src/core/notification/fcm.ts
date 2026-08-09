import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

import { getDevicePushToken, persistDeviceToken } from '@/core/notification/deviceService';
import { supabase } from '@/core/supabase/client';

type Unsubscribe = () => void;

const unsubscribers: Unsubscribe[] = [];

/** RN Firebase v26+ modular API (namespaced `.default()` removed). */
function messagingMod() {
  return require('@react-native-firebase/messaging') as typeof import('@react-native-firebase/messaging');
}

async function androidSdkInt(): Promise<number> {
  const version = Platform.Version;
  return typeof version === 'number' ? version : parseInt(String(version), 10);
}

async function requestAndroidPostNotifications(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const sdk = await androidSdkInt();
  if (Number.isNaN(sdk) || sdk < 33) {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  const already = await PermissionsAndroid.check(permission);
  if (already) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** Read-only OS notification permission (no prompts). */
export async function getNotificationPermissionGranted(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const sdk = await androidSdkInt();
      if (Number.isNaN(sdk) || sdk < 33) {
        return true;
      }
      return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    const { AuthorizationStatus, getMessaging, hasPermission } = messagingMod();
    const status = await hasPermission(getMessaging());
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
  } catch {
    return false;
  }
}

/**
 * Explain benefit before OS prompt (PH1 Step 11).
 * Returns true when notification permission is granted.
 */
export async function requestNotificationPermissionWithRationale(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Stay updated',
      'Enable notifications to get reminders and study updates for English for SE.',
      [
        {
          text: 'Not now',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Enable',
          onPress: () => {
            (async () => {
              try {
                if (Platform.OS === 'android') {
                  resolve(await requestAndroidPostNotifications());
                  return;
                }
                const {
                  AuthorizationStatus,
                  getMessaging,
                  isDeviceRegisteredForRemoteMessages,
                  registerDeviceForRemoteMessages,
                  requestPermission,
                } = messagingMod();
                const messaging = getMessaging();
                if (!isDeviceRegisteredForRemoteMessages(messaging)) {
                  await registerDeviceForRemoteMessages(messaging);
                }
                const authStatus = await requestPermission(messaging, {
                  alert: true,
                  badge: true,
                  sound: true,
                });
                const enabled =
                  authStatus === AuthorizationStatus.AUTHORIZED ||
                  authStatus === AuthorizationStatus.PROVISIONAL;
                if (!enabled) {
                  // Defer so it is not swallowed by the rationale Alert dismissal on iOS.
                  setTimeout(() => {
                    Alert.alert(
                      'Notifications',
                      `Permission was not granted (status ${String(
                        authStatus,
                      )}). You can enable it in iOS Settings.`,
                      [
                        { text: 'Not now', style: 'cancel' },
                        {
                          text: 'Open Settings',
                          onPress: () => {
                            Linking.openSettings().catch(() => undefined);
                          },
                        },
                      ],
                    );
                  }, 400);
                }
                resolve(enabled);
              } catch (error) {
                Alert.alert(
                  'Notifications',
                  error instanceof Error
                    ? error.message
                    : 'Could not request notification permission.',
                );
                resolve(false);
              }
            })().catch((error) => {
              Alert.alert(
                'Notifications',
                error instanceof Error
                  ? error.message
                  : 'Could not request notification permission.',
              );
              resolve(false);
            });
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export async function obtainAndPersistFcmToken(userId: string): Promise<string | null> {
  try {
    const { getMessaging, getToken, registerDeviceForRemoteMessages } = messagingMod();
    const messaging = getMessaging();
    await registerDeviceForRemoteMessages(messaging);
    const token = await getToken(messaging);
    if (!token) {
      return null;
    }
    await persistDeviceToken(userId, token);
    return token;
  } catch {
    return null;
  }
}

export async function syncNotificationsForSignedInUser(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('enabled')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      return;
    }
    // Do not re-activate tokens when the user preference is off / missing.
    if (!data?.enabled) {
      return;
    }

    const existing = await getDevicePushToken();
    if (existing) {
      await persistDeviceToken(userId, existing);
    }
    await obtainAndPersistFcmToken(userId);
  } catch {
    // Non-blocking
  }
}

export async function initializeNotifications(): Promise<void> {
  try {
    const {
      getInitialNotification,
      getMessaging,
      onMessage,
      onNotificationOpenedApp,
      onTokenRefresh,
    } = messagingMod();
    const messaging = getMessaging();

    unsubscribers.push(
      onTokenRefresh(messaging, async (token: string) => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id && token) {
          await persistDeviceToken(user.id, token);
        }
      }),
    );

    unsubscribers.push(
      onMessage(messaging, async (remoteMessage: { notification?: { title?: string } }) => {
        const title = remoteMessage.notification?.title ?? 'Notification';
        Alert.alert(title, 'You have a new message.');
      }),
    );

    unsubscribers.push(
      onNotificationOpenedApp(messaging, () => {
        // App opened from background by notification tap — RootNavigator resolves auth route.
      }),
    );

    await getInitialNotification(messaging);
  } catch {
    // Missing google-services / permissions — app remains usable.
  }
}

export function teardownNotificationListeners(): void {
  while (unsubscribers.length) {
    const stop = unsubscribers.pop();
    stop?.();
  }
}
