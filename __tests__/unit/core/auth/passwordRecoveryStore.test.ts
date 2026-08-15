import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  readPasswordRecoveryPending,
  writePasswordRecoveryPending,
} from '@/core/auth/passwordRecoveryStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('passwordRecoveryStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads and writes the pending flag', async () => {
    jest
      .mocked(AsyncStorage.getItem)
      .mockResolvedValueOnce(JSON.stringify({ at: Date.now(), userId: 'u1' }));
    await expect(readPasswordRecoveryPending('u1')).resolves.toBe(true);

    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
    await expect(readPasswordRecoveryPending()).resolves.toBe(false);

    await writePasswordRecoveryPending(true, 'u1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tanlabs/password_recovery_pending_v1',
      expect.stringContaining('"userId":"u1"'),
    );

    await writePasswordRecoveryPending(false);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@tanlabs/password_recovery_pending_v1');
  });

  it('rejects legacy payloads and mismatched or missing users', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('1');
    await expect(readPasswordRecoveryPending('u1')).resolves.toBe(false);

    jest
      .mocked(AsyncStorage.getItem)
      .mockResolvedValueOnce(JSON.stringify({ at: Date.now(), userId: 'u1' }));
    await expect(readPasswordRecoveryPending('u2')).resolves.toBe(false);

    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify({ at: Date.now() }));
    await expect(readPasswordRecoveryPending('u1')).resolves.toBe(false);

    await writePasswordRecoveryPending(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('swallows storage failures', async () => {
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('boom'));
    await expect(readPasswordRecoveryPending()).resolves.toBe(false);

    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('boom'));
    await expect(writePasswordRecoveryPending(true, 'u1')).resolves.toBeUndefined();
  });
});
