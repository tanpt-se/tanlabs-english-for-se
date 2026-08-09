import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { RootNavigator } from '@/app/navigation/RootNavigator';
import { useAuth } from '@/core/auth/AuthProvider';

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/features/auth/screens/LoginScreen', () => ({
  LoginScreen: () => null,
}));
jest.mock('@/features/auth/screens/RegisterScreen', () => ({
  RegisterScreen: () => null,
}));
jest.mock('@/features/home/screens/HomeScreen', () => ({
  HomeScreen: () => null,
}));
jest.mock('@/features/settings/screens/SettingsScreen', () => ({
  SettingsScreen: () => null,
}));
jest.mock('@/features/profile/screens/CompleteProfileScreen', () => ({
  CompleteProfileScreen: () => null,
}));
jest.mock('@/features/profile/screens/EditProfileScreen', () => ({
  EditProfileScreen: () => null,
}));

jest.mock('@react-navigation/native-stack', () => {
  const ReactLocal = require('react');
  const { Text: TextLocal } = require('react-native');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        ReactLocal.createElement(ReactLocal.Fragment, null, children),
      Screen: ({ name }: { name: string }) => ReactLocal.createElement(TextLocal, null, name),
    }),
  };
});

describe('RootNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(BootSplash.hide).mockResolvedValue(undefined);
  });

  it('shows a boot spinner until auth is ready', async () => {
    jest.mocked(useAuth).mockReturnValue({
      bootstrapped: false,
      destination: 'auth',
      profileSettled: false,
      session: null,
    } as never);

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<RootNavigator />);
    });

    expect(root.root.findByType(ActivityIndicator)).toBeTruthy();
    expect(BootSplash.hide).not.toHaveBeenCalled();
  });

  it('hides BootSplash and renders the auth stack', async () => {
    jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('dark');
    jest.mocked(useAuth).mockReturnValue({
      bootstrapped: true,
      destination: 'auth',
      profileSettled: true,
      session: null,
    } as never);

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<RootNavigator />);
    });

    expect(BootSplash.hide).toHaveBeenCalledWith({ fade: true });
    const labels = root.root.findAllByType(Text).map((node) => node.props.children);
    expect(labels).toEqual(expect.arrayContaining(['Login', 'Register']));
  });

  it('renders complete-profile and app stacks by destination', async () => {
    jest.mocked(useAuth).mockReturnValue({
      bootstrapped: true,
      destination: 'completeProfile',
      profileSettled: true,
      session: { user: { id: 'user-1' } },
    } as never);

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<RootNavigator />);
    });
    expect(root.root.findByType(Text).props.children).toBe('CompleteProfile');

    await act(() => {
      jest.mocked(useAuth).mockReturnValue({
        bootstrapped: true,
        destination: 'app',
        profileSettled: true,
        session: { user: { id: 'user-1' } },
      } as never);
      root.update(<RootNavigator />);
    });
    const labels = root.root.findAllByType(Text).map((node) => node.props.children);
    expect(labels).toEqual(expect.arrayContaining(['Home', 'Settings', 'EditProfile']));
  });

  it('keeps the spinner while session profile is settling', async () => {
    jest.mocked(useAuth).mockReturnValue({
      bootstrapped: true,
      destination: 'app',
      profileSettled: false,
      session: { user: { id: 'user-1' } },
    } as never);

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<RootNavigator />);
    });
    expect(root.root.findByType(ActivityIndicator)).toBeTruthy();
  });
});
