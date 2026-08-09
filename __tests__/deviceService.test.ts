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
      error: null,
    });

    const eqFinal = jest.fn().mockResolvedValue({ error: null });
    const eqFirst = jest.fn(() => ({ eq: eqFinal }));
    const update = jest.fn(() => ({ eq: eqFirst }));
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await deactivateCurrentDevice();

    expect(supabase.from).toHaveBeenCalledWith('user_devices');
    expect(update).toHaveBeenCalledWith({ is_active: false });
    expect(eqFirst).toHaveBeenCalledWith('user_id', 'user-b');
    expect(eqFinal).toHaveBeenCalled();
  });

  it('throws when deactivate updates fail', async () => {
    setDevicePushTokenForTests('fcm-token-4');
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-c' } },
      error: null,
    });

    const eqFinal = jest.fn().mockResolvedValue({ error: { message: 'rls denied' } });
    const eqFirst = jest.fn(() => ({ eq: eqFinal }));
    const update = jest.fn(() => ({ eq: eqFirst }));
    (supabase.from as jest.Mock).mockReturnValue({ update });

    await expect(deactivateCurrentDevice()).rejects.toThrow(/Device deactivate failed/);
  });

  it('no-ops deactivate when there is no signed-in user', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await deactivateCurrentDevice();

    expect(supabase.from).not.toHaveBeenCalled();
  });
});
