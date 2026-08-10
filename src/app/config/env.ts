import Config from 'react-native-config';

export type AppEnv = 'development' | 'production';

function readString(value: string | undefined): string {
  return (value ?? '').trim();
}

function resolveAppEnv(raw: string): AppEnv {
  if (raw === 'production') {
    return 'production';
  }
  if (raw === 'development' || raw === '') {
    return 'development';
  }
  if (raw === 'staging') {
    throw new Error('APP_ENV=staging was removed; use development or production');
  }
  throw new Error(`Invalid APP_ENV="${raw}". Expected development or production.`);
}

export const APP_ENV = resolveAppEnv(readString(Config.APP_ENV));
export const SUPABASE_URL = readString(Config.SUPABASE_URL);
export const SUPABASE_ANON_KEY = readString(Config.SUPABASE_ANON_KEY);
export const API_BASE_URL = readString(Config.API_BASE_URL);

export const isDevelopment = APP_ENV === 'development';
export const isProduction = APP_ENV === 'production';
