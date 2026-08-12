import React from 'react';
import { useColorScheme } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppTextInput } from '@/components/ui/input';
import { triggerTestCrash, recordError } from '@/core/monitoring/crashlytics';
import { validateProfileInput } from '@/core/profile/validation';

import App from '../../App';

jest.mock('@/app/bootstrap/postRender', () => ({
  runPostRenderBootstrap: jest.fn(async () => undefined),
}));

jest.mock('@/app/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

jest.mock('@/app/providers/AppProviders', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => children,
}));

describe('final branch gaps', () => {
  afterEach(() => {
    jest.mocked(useColorScheme).mockReturnValue('light');
  });

  it('renders App status bar for dark mode', async () => {
    jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('dark');
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<App />);
    });
    expect(root.root.findByProps({ barStyle: 'light-content' })).toBeTruthy();
  });

  it('rejects overlong profile display names', () => {
    expect(validateProfileInput({ displayName: 'x'.repeat(41), englishLevel: 'B1' })).toMatch(
      /at most 40/,
    );
  });

  it('honors an explicit text input placeholder color', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <AppTextInput placeholderTextColor="#123456" value="" onChangeText={() => undefined} />,
      );
    });
    expect(root.root.findByProps({ placeholderTextColor: '#123456' })).toBeTruthy();
  });

  it('skips controlled crash outside __DEV__', () => {
    const devGlobal = globalThis as typeof globalThis & { __DEV__: boolean };
    const previous = devGlobal.__DEV__;
    try {
      devGlobal.__DEV__ = false;
      expect(() => triggerTestCrash()).not.toThrow();
    } finally {
      devGlobal.__DEV__ = previous;
    }
  });

  it('skips crashlytics warn outside __DEV__ when native record fails', async () => {
    const devGlobal = globalThis as typeof globalThis & { __DEV__: boolean };
    const previous = devGlobal.__DEV__;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      devGlobal.__DEV__ = false;
      const { recordError: recordNative } = require('@react-native-firebase/crashlytics');
      jest.mocked(recordNative).mockImplementationOnce(() => {
        throw new Error('native down');
      });
      await recordError(new Error('x'));
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      devGlobal.__DEV__ = previous;
    }
  });

  it('rejects removed staging APP_ENV', () => {
    expect(() => {
      jest.isolateModules(() => {
        jest.doMock('react-native-config', () => ({
          APP_ENV: 'staging',
          SUPABASE_URL: 'https://example.supabase.co',
          SUPABASE_ANON_KEY: 'anon',
          API_BASE_URL: '',
        }));
        require('@/app/config/env');
      });
    }).toThrow(/staging was removed/);
  });

  it('resolves production APP_ENV via isolateModules', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native-config', () => ({
        APP_ENV: 'production',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon',
        API_BASE_URL: '',
        GRAMMAR_FORCE_LOCAL_SEED: '1',
      }));
      const { APP_ENV, isDevelopment, isProduction, GRAMMAR_FORCE_LOCAL_SEED } =
        require('@/app/config/env') as typeof import('@/app/config/env');
      expect(APP_ENV).toBe('production');
      expect(isDevelopment).toBe(false);
      expect(isProduction).toBe(true);
      expect(GRAMMAR_FORCE_LOCAL_SEED).toBe(false);
    });
  });

  it('enables GRAMMAR_FORCE_LOCAL_SEED only for development truthy flags', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native-config', () => ({
        APP_ENV: 'development',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon',
        GRAMMAR_FORCE_LOCAL_SEED: 'yes',
      }));
      const { GRAMMAR_FORCE_LOCAL_SEED } =
        require('@/app/config/env') as typeof import('@/app/config/env');
      expect(GRAMMAR_FORCE_LOCAL_SEED).toBe(true);
    });
    jest.isolateModules(() => {
      jest.doMock('react-native-config', () => ({
        APP_ENV: 'development',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'anon',
        GRAMMAR_FORCE_LOCAL_SEED: '0',
      }));
      const { GRAMMAR_FORCE_LOCAL_SEED } =
        require('@/app/config/env') as typeof import('@/app/config/env');
      expect(GRAMMAR_FORCE_LOCAL_SEED).toBe(false);
    });
  });
});
