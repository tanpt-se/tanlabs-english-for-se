declare module 'react-native-config' {
  export interface NativeConfig {
    APP_ENV?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    API_BASE_URL?: string;
    GRAMMAR_FORCE_LOCAL_SEED?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
