import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';

const mockNavigate = jest.fn();
const mockSignOut = jest.fn(async () => undefined);
const mockTrackEvent = jest.fn(async () => undefined);
const mockSetEnabled = jest.fn();
const mockRefetch = jest.fn(async () => undefined);

const profileState = {
  data: null as {
    display_name?: string | null;
    english_level?: string | null;
  } | null,
  isError: false,
  isFetching: false,
};

const notificationState = {
  preferenceEnabled: true,
  isUpdating: false,
};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual(
    '@react-navigation/native',
  ) as typeof import('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: () => ({ signOut: mockSignOut, user: { email: 'test@tanlabs.dev' } }),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

jest.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: () => ({ ...profileState, refetch: mockRefetch }),
}));

jest.mock('@/features/settings/hooks/useNotificationSettings', () => ({
  useNotificationSettings: () => ({ ...notificationState, setEnabled: mockSetEnabled }),
}));

jest.mock('@/features/profile/components', () => ({
  ...(() => {
    const ReactLocal = require('react');
    const { Pressable: RnPressable, Text: RnText } = require('react-native');
    return {
      ProfileSummaryCard: ({
        displayName,
        levelLabel,
        onEditPress,
      }: {
        displayName: string;
        levelLabel: string;
        onEditPress: () => void;
      }) =>
        ReactLocal.createElement(
          RnPressable,
          { testID: 'profile-summary-edit', onPress: onEditPress },
          ReactLocal.createElement(RnText, null, displayName),
          ReactLocal.createElement(RnText, null, levelLabel),
        ),
    };
  })(),
}));

jest.mock('@/features/settings/components', () => ({
  ...(() => {
    const ReactLocal = require('react');
    const { Pressable: RnPressable, Text: RnText } = require('react-native');
    return {
      SettingRow: ({
        label,
        onValueChange,
      }: {
        label: string;
        onValueChange?: (value: boolean) => void;
      }) =>
        ReactLocal.createElement(
          RnPressable,
          { testID: `setting-row-${label}`, onPress: () => onValueChange?.(false) },
          ReactLocal.createElement(RnText, null, label),
        ),
    };
  })(),
}));

jest.mock('@/components/ui/button', () => ({
  ...(() => {
    const ReactLocal = require('react');
    const { Pressable: RnPressable, Text: RnText } = require('react-native');
    return {
      AppButton: ({
        testID,
        label,
        onPress,
      }: {
        testID?: string;
        label: string;
        onPress: () => void;
      }) =>
        ReactLocal.createElement(
          RnPressable,
          { testID: testID ?? `app-button-${label}`, onPress },
          ReactLocal.createElement(RnText, null, label),
        ),
    };
  })(),
}));

jest.mock('@/components/ui/feedback', () => ({
  ...(() => {
    const ReactLocal = require('react');
    const { Pressable: RnPressable } = require('react-native');
    return {
      ConfirmModal: ({
        visible,
        onCancel,
        onConfirm,
      }: {
        visible: boolean;
        onCancel: () => void;
        onConfirm: () => void;
      }) =>
        visible
          ? ReactLocal.createElement(
              ReactLocal.Fragment,
              null,
              ReactLocal.createElement(RnPressable, {
                testID: 'confirm-cancel',
                onPress: onCancel,
              }),
              ReactLocal.createElement(RnPressable, {
                testID: 'confirm-submit',
                onPress: onConfirm,
              }),
            )
          : null,
    };
  })(),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    profileState.data = null;
    profileState.isError = false;
    profileState.isFetching = false;
    notificationState.preferenceEnabled = true;
    notificationState.isUpdating = false;
  });

  it('renders defaults, navigates edit, toggles notifications, and signs out', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<SettingsScreen />);
    });

    expect(root.root.findAllByType(Text).some((node) => node.props.children === 'Learner')).toBe(
      true,
    );
    expect(root.root.findAllByType(Text).some((node) => node.props.children === '—')).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'profile-summary-edit' }).props.onPress();
      root.root.findByProps({ testID: 'setting-row-Enable notifications' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('EditProfile');
    expect(mockSetEnabled).toHaveBeenCalledWith(false);

    await act(() => {
      root.root.findByProps({ testID: 'settings-sign-out' }).props.onPress();
    });
    await act(() => {
      root.root.findByProps({ testID: 'confirm-submit' }).props.onPress();
    });
    expect(mockTrackEvent).toHaveBeenCalledWith('logout');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows retry block and handles retry + cancel modal', async () => {
    profileState.data = { display_name: 'Tan', english_level: 'C1' };
    profileState.isError = true;
    profileState.isFetching = true;

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<SettingsScreen />);
    });
    expect(
      root.root.findAllByType(Text).some((node) => node.props.children === 'C1 · Advanced'),
    ).toBe(true);
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Could not load profile')),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'app-button-Retrying…' }).props.onPress();
    });
    expect(mockRefetch).toHaveBeenCalled();

    profileState.isFetching = false;
    await act(() => {
      root.update(<SettingsScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'settings-sign-out' }).props.onPress();
    });
    await act(() => {
      root.root.findByProps({ testID: 'confirm-cancel' }).props.onPress();
    });
    expect(root.root.findAllByProps({ testID: 'confirm-cancel' })).toHaveLength(0);
  });

  it('keeps modal open when cancel is pressed while busy', async () => {
    let resolveSignOut: (() => void) | undefined;
    mockSignOut.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSignOut = resolve;
        }),
    );

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<SettingsScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'settings-sign-out' }).props.onPress();
    });
    await act(() => {
      root.root.findByProps({ testID: 'confirm-submit' }).props.onPress();
    });
    await act(() => {
      root.root.findByProps({ testID: 'confirm-cancel' }).props.onPress();
    });
    expect(root.root.findAllByProps({ testID: 'confirm-cancel' }).length).toBeGreaterThan(0);

    await act(async () => {
      resolveSignOut?.();
      await Promise.resolve();
    });
  });
});
