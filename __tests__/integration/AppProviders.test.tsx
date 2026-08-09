import React from 'react';
import { Text, StatusBar } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  AppProviders,
  // Persisted internals are exercised via resume helper + render
} from '@/app/providers/AppProviders';
import { shouldResumePausedMutations } from '@/app/providers/NetworkProvider';
import { queryClient } from '@/lib/queryClient';

jest.mock('@/app/providers/NetworkProvider', () => {
  const actual = jest.requireActual('@/app/providers/NetworkProvider');
  return {
    ...actual,
    NetworkProvider: ({ children }: { children: React.ReactNode }) => children,
    useNetworkStatus: jest.fn(() => ({
      isConnectionKnown: true,
      isOnline: true,
      connectionType: 'wifi',
    })),
  };
});

jest.mock('@/core/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/core/notification/mutations', () => ({
  configureNotificationMutationDefaults: jest.fn(),
}));

jest.mock('@tanstack/react-query-persist-client', () => ({
  PersistQueryClientProvider: ({
    children,
    onSuccess,
  }: {
    children: React.ReactNode;
    onSuccess?: () => void;
  }) => {
    const ReactLocal = require('react');
    ReactLocal.useEffect(() => {
      onSuccess?.();
    }, [onSuccess]);
    return children;
  },
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: View,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

describe('AppProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(queryClient, 'resumePausedMutations').mockResolvedValue([] as never);
  });

  it('renders children with light status bar chrome', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <AppProviders>
          <Text>child</Text>
        </AppProviders>,
      );
      await Promise.resolve();
    });

    expect(root.root.findByType(Text).props.children).toBe('child');
    expect(root.root.findByType(StatusBar).props.barStyle).toBe('dark-content');
    expect(shouldResumePausedMutations(true, true, true)).toBe(true);
  });

  it('uses light-content status bar in dark mode', async () => {
    jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('dark');
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <AppProviders>
          <Text>dark</Text>
        </AppProviders>,
      );
      await Promise.resolve();
    });
    expect(root.root.findByType(StatusBar).props.barStyle).toBe('light-content');
  });

  it('resumes paused mutations after cache restore when online', async () => {
    await act(async () => {
      ReactTestRenderer.create(
        <AppProviders>
          <Text>online</Text>
        </AppProviders>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(queryClient.resumePausedMutations).toHaveBeenCalled();
  });
});
