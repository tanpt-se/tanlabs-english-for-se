import {
  AuthorizationStatus,
  deleteToken,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

import {
  clearDevicePushToken,
  getDevicePushToken,
  persistDeviceToken,
} from '@/core/notification/deviceService';
import {
  deleteCurrentFcmToken,
  getNotificationPermissionGranted,
  initializeNotifications,
  obtainAndPersistFcmToken,
  requestNotificationPermissionWithRationale,
  syncNotificationsForSignedInUser,
  teardownNotificationListeners,
} from '@/core/notification/fcm';
import { supabase } from '@/core/supabase/client';

jest.mock('@/core/notification/deviceService', () => ({
  clearDevicePushToken: jest.fn(async () => undefined),
  getDevicePushToken: jest.fn(async () => null),
  persistDeviceToken: jest.fn(async () => undefined),
}));

jest.mock('@/core/supabase/client', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

function mockPreference(enabled: boolean, error: Error | null = null) {
  const maybeSingle = jest.fn(async () => ({
    data: error ? null : { enabled },
    error,
  }));
  jest.mocked(supabase.from).mockReturnValue({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({ maybeSingle })),
    })),
  } as never);
}

describe('fcm permission and token lifecycle', () => {
  const originalOS = Platform.OS;
  const originalVersion = Platform.Version;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getToken).mockResolvedValue('fcm-token');
    jest.mocked(hasPermission).mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    jest.mocked(requestPermission).mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    jest.mocked(deleteToken).mockResolvedValue(undefined);
    jest.mocked(getInitialNotification).mockResolvedValue(null);
    jest.mocked(onTokenRefresh).mockReturnValue(jest.fn());
    jest.mocked(onMessage).mockReturnValue(jest.fn());
    jest.mocked(onNotificationOpenedApp).mockReturnValue(jest.fn());
    jest.mocked(getDevicePushToken).mockResolvedValue(null);
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'ios' });
    Object.defineProperty(Platform, 'Version', { configurable: true, get: () => 17 });
  });

  afterEach(() => {
    teardownNotificationListeners();
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOS });
    Object.defineProperty(Platform, 'Version', {
      configurable: true,
      get: () => originalVersion,
    });
  });

  it('reports iOS granted permission via Firebase messaging', async () => {
    await expect(getNotificationPermissionGranted()).resolves.toBe(true);
    expect(hasPermission).toHaveBeenCalledWith(getMessaging());
  });

  it('treats Android below API 33 as granted without POST_NOTIFICATIONS', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' });
    Object.defineProperty(Platform, 'Version', { configurable: true, get: () => 32 });
    await expect(getNotificationPermissionGranted()).resolves.toBe(true);
  });

  it('checks Android POST_NOTIFICATIONS on API 33+', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' });
    Object.defineProperty(Platform, 'Version', { configurable: true, get: () => 33 });
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true);
    await expect(getNotificationPermissionGranted()).resolves.toBe(true);
    expect(PermissionsAndroid.check).toHaveBeenCalledWith(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  });

  it('returns false when permission checks throw', async () => {
    jest.mocked(hasPermission).mockRejectedValueOnce(new Error('messaging missing'));
    await expect(getNotificationPermissionGranted()).resolves.toBe(false);
  });

  it('requests notification permission through the rationale alert', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const enable = buttons?.find((button) => button.text === 'Enable');
      enable?.onPress?.();
    });

    await expect(requestNotificationPermissionWithRationale()).resolves.toBe(true);
    expect(requestPermission).toHaveBeenCalled();
  });

  it('cancels when the user dismisses the rationale', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, _buttons, options) => {
      options?.onDismiss?.();
    });
    await expect(requestNotificationPermissionWithRationale()).resolves.toBe(false);
  });

  it('requests Android POST_NOTIFICATIONS after rationale Enable', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' });
    Object.defineProperty(Platform, 'Version', { configurable: true, get: () => 34 });
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === 'Enable')?.onPress?.();
    });

    await expect(requestNotificationPermissionWithRationale()).resolves.toBe(true);
    expect(PermissionsAndroid.request).toHaveBeenCalled();
  });

  it('shows Settings when iOS permission is denied', async () => {
    jest.useFakeTimers();
    jest.mocked(requestPermission).mockResolvedValue(AuthorizationStatus.DENIED);
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined as never);
    jest.spyOn(Alert, 'alert').mockImplementation((title, _message, buttons) => {
      if (title === 'Stay updated') {
        buttons?.find((button) => button.text === 'Enable')?.onPress?.();
        return;
      }
      buttons?.find((button) => button.text === 'Open Settings')?.onPress?.();
    });

    const result = requestNotificationPermissionWithRationale();
    await Promise.resolve();
    jest.advanceTimersByTime(400);
    await expect(result).resolves.toBe(false);
    expect(openSettings).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('persists FCM tokens only when preference is enabled', async () => {
    mockPreference(true);
    await expect(obtainAndPersistFcmToken('user-1')).resolves.toBe('fcm-token');
    expect(persistDeviceToken).toHaveBeenCalledWith('user-1', 'fcm-token');

    mockPreference(false);
    await expect(obtainAndPersistFcmToken('user-1')).resolves.toBeNull();
  });

  it('returns null when getToken fails', async () => {
    mockPreference(true);
    jest.mocked(getToken).mockRejectedValueOnce(new Error('no token'));
    await expect(obtainAndPersistFcmToken('user-1')).resolves.toBeNull();
  });

  it('clears local token after Firebase deletion', async () => {
    await deleteCurrentFcmToken();
    expect(deleteToken).toHaveBeenCalledWith(getMessaging());
    expect(clearDevicePushToken).toHaveBeenCalled();
  });

  it('syncs existing and remote tokens for signed-in users', async () => {
    mockPreference(true);
    jest.mocked(getDevicePushToken).mockResolvedValue('cached-token');
    await syncNotificationsForSignedInUser('user-1');
    expect(persistDeviceToken).toHaveBeenCalledWith('user-1', 'cached-token');
    expect(persistDeviceToken).toHaveBeenCalledWith('user-1', 'fcm-token');
  });

  it('no-ops sync when preference is off', async () => {
    mockPreference(false);
    await syncNotificationsForSignedInUser('user-1');
    expect(persistDeviceToken).not.toHaveBeenCalled();
  });

  it('registers listeners and tears them down', async () => {
    const stopRefresh = jest.fn();
    const stopMessage = jest.fn();
    const stopOpened = jest.fn();
    jest.mocked(onTokenRefresh).mockReturnValue(stopRefresh);
    jest.mocked(onMessage).mockReturnValue(stopMessage);
    jest.mocked(onNotificationOpenedApp).mockReturnValue(stopOpened);

    await initializeNotifications();
    expect(getInitialNotification).toHaveBeenCalledWith(getMessaging());

    teardownNotificationListeners();
    expect(stopRefresh).toHaveBeenCalled();
    expect(stopMessage).toHaveBeenCalled();
    expect(stopOpened).toHaveBeenCalled();
  });

  it('alerts on foreground messages', async () => {
    let messageHandler:
      | ((remote: { notification?: { title?: string } }) => Promise<void>)
      | undefined;
    jest.mocked(onMessage).mockImplementation((_messaging, callback) => {
      messageHandler = callback as typeof messageHandler;
      return jest.fn();
    });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    await initializeNotifications();
    await messageHandler?.({ notification: { title: 'Study' } });
    expect(alert).toHaveBeenCalledWith('Study', 'You have a new message.');
    await messageHandler?.({});
    expect(alert).toHaveBeenCalledWith('Notification', 'You have a new message.');
  });

  it('declines when the user taps Not now on the rationale', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === 'Not now')?.onPress?.();
    });
    await expect(requestNotificationPermissionWithRationale()).resolves.toBe(false);
  });

  it('treats provisional iOS status as granted', async () => {
    jest.mocked(hasPermission).mockResolvedValue(AuthorizationStatus.PROVISIONAL);
    await expect(getNotificationPermissionGranted()).resolves.toBe(true);
  });

  it('skips persist when Firebase returns an empty token', async () => {
    mockPreference(true);
    jest.mocked(getToken).mockResolvedValueOnce('');
    await expect(obtainAndPersistFcmToken('user-1')).resolves.toBeNull();
    expect(persistDeviceToken).not.toHaveBeenCalled();
  });

  it('swallows initialize failures when messaging is unavailable', async () => {
    jest.mocked(getMessaging).mockImplementationOnce(() => {
      throw new Error('no firebase');
    });
    await expect(initializeNotifications()).resolves.toBeUndefined();
  });

  it('clears local token when refresh preference lookup fails', async () => {
    let refresh: ((token: string) => Promise<void>) | undefined;
    jest.mocked(onTokenRefresh).mockImplementation((_messaging, callback) => {
      refresh = callback as (token: string) => Promise<void>;
      return jest.fn();
    });
    jest.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as never);
    mockPreference(true, new Error('offline'));
    await initializeNotifications();
    await refresh?.('refresh-token');
    expect(deleteToken).toHaveBeenCalled();
    expect(clearDevicePushToken).toHaveBeenCalled();
  });

  it('parses Android string SDK versions and short-circuits when already granted', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' });
    Object.defineProperty(Platform, 'Version', { configurable: true, get: () => '34' });
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === 'Enable')?.onPress?.();
    });
    await expect(requestNotificationPermissionWithRationale()).resolves.toBe(true);
    expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  });

  it('surfaces native request errors from the Enable action', async () => {
    jest.mocked(requestPermission).mockRejectedValueOnce(new Error('denied by OS'));
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (title === 'Stay updated') {
        buttons?.find((button) => button.text === 'Enable')?.onPress?.();
        return;
      }
      expect(message).toBe('denied by OS');
    });
    await expect(requestNotificationPermissionWithRationale()).resolves.toBe(false);
  });

  it('maps non-Error enable failures to a generic alert', async () => {
    jest.mocked(requestPermission).mockRejectedValueOnce('nope');
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (title === 'Stay updated') {
        buttons?.find((button) => button.text === 'Enable')?.onPress?.();
        return;
      }
      expect(message).toBe('Could not request notification permission.');
    });
    await expect(requestNotificationPermissionWithRationale()).resolves.toBe(false);
  });

  it('clears cached token when refresh handler throws before preference check', async () => {
    let refresh: ((token: string) => Promise<void>) | undefined;
    jest.mocked(onTokenRefresh).mockImplementation((_messaging, callback) => {
      refresh = callback as (token: string) => Promise<void>;
      return jest.fn();
    });
    jest.mocked(supabase.auth.getUser).mockRejectedValueOnce(new Error('auth boom'));
    await initializeNotifications();
    await refresh?.('orphan-token');
    expect(clearDevicePushToken).toHaveBeenCalled();
  });
});
