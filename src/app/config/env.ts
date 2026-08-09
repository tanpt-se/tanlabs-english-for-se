import Config from 'react-native-config';

export type AppEnv = 'development' | 'staging' | 'production';

function readString(value: string | undefined): string {
  return (value ?? '').trim();
}

function resolveAppEnv(raw: string): AppEnv {
  if (raw === 'staging' || raw === 'production' || raw === 'development') {
    return raw;
  }
  return 'development';
}

export const APP_ENV = resolveAppEnv(readString(Config.APP_ENV));
export const SUPABASE_URL = readString(Config.SUPABASE_URL);
export const SUPABASE_ANON_KEY = readString(Config.SUPABASE_ANON_KEY);
export const API_BASE_URL = readString(Config.API_BASE_URL);

export const isDevelopment = APP_ENV === 'development';
export const isProduction = APP_ENV === 'production';
