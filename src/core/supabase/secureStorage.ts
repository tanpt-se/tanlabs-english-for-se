import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ACCESSIBLE,
  SECURITY_LEVEL,
  STORAGE_TYPE,
  getGenericPassword,
  resetGenericPassword,
  setGenericPassword,
} from 'react-native-keychain';

function serviceForKey(key: string): string {
  return `com.tanlabs.english.supabase.${key}`;
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const service = serviceForKey(key);
    const credentials = await getGenericPassword({ service });
    if (credentials) {
      return credentials.password;
    }

    const legacyValue = await AsyncStorage.getItem(key);
    if (!legacyValue) {
      return null;
    }

    await secureSessionStorage.setItem(key, legacyValue);
    return legacyValue;
  },

  async setItem(key: string, value: string): Promise<void> {
    const stored = await setGenericPassword('supabase-session', value, {
      accessible: ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      securityLevel: SECURITY_LEVEL.SECURE_SOFTWARE,
      service: serviceForKey(key),
      storage: STORAGE_TYPE.AES_GCM_NO_AUTH,
    });
    if (!stored) {
      throw new Error('Secure session storage is unavailable.');
    }
    await AsyncStorage.removeItem(key);
  },

  async removeItem(key: string): Promise<void> {
    try {
      await resetGenericPassword({ service: serviceForKey(key) });
    } catch {
      // Ignore Keychain errors on wipe.
    }
    await AsyncStorage.removeItem(key);
  },
};
