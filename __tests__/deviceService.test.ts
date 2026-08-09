import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  deactivateCurrentDevice,
  getDevicePushToken,
  persistDeviceToken,
  setDevicePushTokenForTests,
} from '@/core/notification/deviceService';
import { supabase } from '@/core/supabase/client';

jest.mock('@/core/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe('deviceService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    setDevicePushTokenForTests(null);
    await AsyncStorage.clear();
  });

  it('persists token via claim_device_token RPC and stores locally', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

    await persistDeviceToken('user-a', 'fcm-token-1');

    expect(supabase.rpc).toHaveBeenCalledWith('claim_device_token', {
      p_token: 'fcm-token-1',
      p_platform: expect.stringMatching(/^(ios|android)$/),
    });
    expect(await getDevicePushToken()).toBe('fcm-token-1');
    expect(await AsyncStorage.getItem('tanlabs.fcm.device_token')).toBe('fcm-token-1');
  });

  it('falls back to upsert when claim RPC is unavailable', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'function claim_device_token does not exist' },
    });
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert });

    await persistDeviceToken('user-a', 'fcm-token-2');

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-a',
        fcm_token: 'fcm-token-2',
        is_active: true,
      }),
      { onConflict: 'user_id,fcm_token' },
    );
    expect(await getDevicePushToken()).toBe('fcm-token-2');
  });

  it('deactivates stored token and all active rows for the user', async () => {
    setDevicePushTokenForTests('fcm-token-3');
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-b' } },
    });

    const eq3 = jest.fn().mockResolvedValue({ error: null });
    const eq2 = jest.fn(() => ({ eq: eq3 }));
    const eq1 = jest.fn(() => ({ eq: eq2 }));
    const update = jest.fn(() => ({ eq: eq1 }));
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await deactivateCurrentDevice();

    expect(supabase.from).toHaveBeenCalledWith('user_devices');
    expect(update).toHaveBeenCalledWith({ is_active: false });
    expect(eq1).toHaveBeenCalledWith('user_id', 'user-b');
  });

  it('no-ops deactivate when there is no signed-in user', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });

    await deactivateCurrentDevice();

    expect(supabase.from).not.toHaveBeenCalled();
  });
});
