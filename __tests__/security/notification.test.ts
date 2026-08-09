import { deleteToken, getMessaging, onTokenRefresh } from '@react-native-firebase/messaging';

import { clearDevicePushToken, persistDeviceToken } from '@/core/notification/deviceService';
import {
  deleteCurrentFcmToken,
  initializeNotifications,
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

function mockPreference(enabled: boolean) {
  const maybeSingle = jest.fn(async () => ({ data: { enabled }, error: null }));
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  jest.mocked(supabase.from).mockReturnValue({ select } as never);
}

describe('notification token security', () => {
  let refresh: ((token: string) => Promise<void>) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as never);
    jest.mocked(onTokenRefresh).mockImplementation((_messaging, callback) => {
      refresh = callback as (token: string) => Promise<void>;
      return jest.fn();
    });
  });

  afterEach(() => {
    teardownNotificationListeners();
  });

  it('invalidates refreshed tokens while notification preference is off', async () => {
    mockPreference(false);
    await initializeNotifications();

    await refresh?.('new-token');

    expect(persistDeviceToken).not.toHaveBeenCalled();
    expect(deleteToken).toHaveBeenCalledWith(getMessaging());
    expect(clearDevicePushToken).toHaveBeenCalled();
  });

  it('persists refreshed tokens only while notification preference is on', async () => {
    mockPreference(true);
    await initializeNotifications();

    await refresh?.('new-token');

    expect(persistDeviceToken).toHaveBeenCalledWith('user-1', 'new-token');
    expect(deleteToken).not.toHaveBeenCalled();
  });

  it('clears the local token when Firebase token deletion fails', async () => {
    jest.mocked(deleteToken).mockRejectedValueOnce(new Error('Firebase unavailable'));

    await expect(deleteCurrentFcmToken()).rejects.toThrow('Firebase unavailable');

    expect(clearDevicePushToken).toHaveBeenCalled();
  });
});
