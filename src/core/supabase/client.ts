import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/app/config/env';
import { secureSessionStorage } from '@/core/supabase/secureStorage';
import type { Database } from '@/types/database';

const hasSupabaseConfig = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

export const supabase = createClient<Database>(
  hasSupabaseConfig ? SUPABASE_URL : 'https://placeholder.supabase.co',
  hasSupabaseConfig ? SUPABASE_ANON_KEY : 'public-anon-key',
  {
    auth: {
      storage: secureSessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export const isSupabaseConfigured = hasSupabaseConfig;
