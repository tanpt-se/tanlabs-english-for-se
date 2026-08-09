import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

import { secureSessionStorage } from '@/core/supabase/secureStorage';

const storageKey = 'sb-project-auth-token';

beforeEach(async () => {
  await AsyncStorage.clear();
  (Keychain as typeof Keychain & { __reset: () => void }).__reset();
  jest.clearAllMocks();
});

test('stores sessions outside AsyncStorage', async () => {
  await secureSessionStorage.setItem(storageKey, 'session-value');

  await expect(AsyncStorage.getItem(storageKey)).resolves.toBeNull();
  await expect(secureSessionStorage.getItem(storageKey)).resolves.toBe('session-value');
});

test('migrates an existing AsyncStorage session', async () => {
  await AsyncStorage.setItem(storageKey, 'legacy-session');

  await expect(secureSessionStorage.getItem(storageKey)).resolves.toBe('legacy-session');
  await expect(AsyncStorage.getItem(storageKey)).resolves.toBeNull();
  expect(Keychain.setGenericPassword).toHaveBeenCalled();
});

test('removes secure and legacy session values', async () => {
  await secureSessionStorage.setItem(storageKey, 'session-value');
  await AsyncStorage.setItem(storageKey, 'legacy-session');

  await secureSessionStorage.removeItem(storageKey);

  await expect(secureSessionStorage.getItem(storageKey)).resolves.toBeNull();
  await expect(AsyncStorage.getItem(storageKey)).resolves.toBeNull();
});

test('does not fall back to AsyncStorage when secure storage fails', async () => {
  jest.mocked(Keychain.setGenericPassword).mockRejectedValueOnce(new Error('Keychain unavailable'));

  await expect(secureSessionStorage.setItem(storageKey, 'session-value')).rejects.toThrow(
    'Keychain unavailable',
  );
  await expect(AsyncStorage.getItem(storageKey)).resolves.toBeNull();
});

test('does not expose a legacy session when secure storage cannot migrate it', async () => {
  await AsyncStorage.setItem(storageKey, 'legacy-session');
  jest.mocked(Keychain.setGenericPassword).mockRejectedValueOnce(new Error('Keychain unavailable'));

  await expect(secureSessionStorage.getItem(storageKey)).rejects.toThrow('Keychain unavailable');
  await expect(AsyncStorage.getItem(storageKey)).resolves.toBe('legacy-session');
});
