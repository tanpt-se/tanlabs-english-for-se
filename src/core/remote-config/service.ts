import {
  DEFAULT_FEATURE_FLAGS,
  listInvalidRemoteFlagKeys,
  parseFeatureFlags,
} from '@/core/remote-config/parser';
import type { FeatureFlags } from '@/core/remote-config/parser';
import { supabase } from '@/core/supabase/client';

export async function fetchFeatureFlags(): Promise<FeatureFlags> {
  try {
    const { data, error } = await supabase.from('app_config').select('key, value');
    if (error) {
      throw error;
    }

    const invalidKeys = listInvalidRemoteFlagKeys(data);
    if (invalidKeys.length > 0 && __DEV__) {
      console.warn('[remote-config] invalid keys', invalidKeys);
    }

    return parseFeatureFlags(data);
  } catch (error) {
    if (__DEV__) {
      console.warn('[remote-config] using defaults', error);
    }
    return { ...DEFAULT_FEATURE_FLAGS };
  }
}

export { DEFAULT_FEATURE_FLAGS };
export type { FeatureFlags };
