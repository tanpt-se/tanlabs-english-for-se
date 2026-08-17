import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AuthUserError } from '@/core/auth/errors';
import { signIn, signUp } from '@/core/auth/service';
import { upsertProfile } from '@/core/profile/service';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { WelcomeScreen } from '@/features/auth/screens/WelcomeScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { CompleteProfileScreen } from '@/features/profile/screens/CompleteProfileScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(async () => undefined),
    }),
  };
});

jest.mock('@/core/auth/service', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
}));

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/core/profile/service', () => ({
  upsertProfile: jest.fn(),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

jest.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

jest.mock('@/features/settings/hooks/useNotificationSettings', () => ({
  useNotificationSettings: jest.fn(),
}));

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(() => ({ data: { grammar: false } })),
}));

jest.mock('@/features/grammar/hooks', () => ({
  useGrammarTopics: jest.fn(() => ({
    data: [],
    isLoading: false,
    isSuccess: true,
  })),
  useGrammarProgress: jest.fn(() => ({
    data: [],
  })),
  useGrammarContinueLearning: jest.fn(() => ({
    target: null,
    isReady: true,
    lessonPosition: null,
  })),
}));

jest.mock('@/features/vocabulary/hooks/useVocabularyProgress', () => ({
  useVocabularyProgress: jest.fn(() => ({
    ready: true,
    overallLabel: '0 / 2500',
    overallRatio: 0,
    situations: [],
    totalKnown: 0,
    totalTerms: 2500,
    libraryKnown: 0,
    libraryTotal: 2500,
    libraryRatio: 0,
  })),
}));

jest.mock('@/features/vocabulary/hooks', () => ({
  useVocabularyWeakProgress: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/features/home/hooks/usePracticeStreak', () => ({
  usePracticeStreak: jest.fn(() => ({
    title: '0 day streak',
    week: ['today', 'upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
    refresh: jest.fn(async () => undefined),
  })),
}));

const { useAuth } = jest.requireMock('@/core/auth/AuthProvider') as {
  useAuth: jest.Mock;
};
const { useProfile } = jest.requireMock('@/features/profile/hooks/useProfile') as {
  useProfile: jest.Mock;
};
const { useNotificationSettings } = jest.requireMock(
  '@/features/settings/hooks/useNotificationSettings',
) as { useNotificationSettings: jest.Mock };
const { trackEvent } = jest.requireMock('@/core/analytics/events') as {
  trackEvent: jest.Mock;
};

const navigate = jest.fn();
const replace = jest.fn();
const goBack = jest.fn();

async function mount(element: React.ReactElement) {
  let root!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    root = ReactTestRenderer.create(element);
  });
  return root;
}

async function waitFor(predicate: () => boolean, label: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (predicate()) {
      return;
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function press(root: ReactTestRenderer.ReactTestRenderer, accessibilityLabel: string) {
  const node = root.root.find(
    (candidate) =>
      candidate.props.accessibilityLabel === accessibilityLabel &&
      typeof candidate.props.onPress === 'function',
  );
  return act(async () => {
    await node.props.onPress();
  });
}

function changeText(
  root: ReactTestRenderer.ReactTestRenderer,
  accessibilityLabel: string,
  value: string,
) {
  const input = root.root.find(
    (candidate) =>
      candidate.props.accessibilityLabel === accessibilityLabel &&
      typeof candidate.props.onChangeText === 'function',
  );
  return act(() => {
    input.props.onChangeText(value);
  });
}

describe('PH1 screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useNavigation).mockReturnValue({ navigate, replace, goBack } as never);
    useAuth.mockReturnValue({
      clearPasswordRecovery: jest.fn(),
      clearRecoveryLinkError: jest.fn(),
      recoveryLinkError: null,
      user: { id: 'user-1' },
      profile: {
        id: 'user-1',
        display_name: 'Ada',
        english_level: 'B2',
        created_at: '',
        updated_at: '',
      },
      refreshProfile: jest.fn(async () => undefined),
      signOut: jest.fn(async () => undefined),
    });
    useProfile.mockReturnValue({
      data: {
        id: 'user-1',
        display_name: 'Ada',
        english_level: 'B2',
        created_at: '',
        updated_at: '',
      },
      isError: false,
      isFetching: false,
      fetchStatus: 'idle',
      refetch: jest.fn(async () => undefined),
    });
    useNotificationSettings.mockReturnValue({
      preferenceEnabled: false,
      osGranted: true,
      setEnabled: jest.fn(),
      isUpdating: false,
    });
  });

  it('navigates from Welcome to Register and Login', async () => {
    const root = await mount(<WelcomeScreen />);
    const getStarted = root.root.findByProps({ testID: 'welcome-get-started' });
    if (typeof getStarted.props.style === 'function') {
      getStarted.props.style({ pressed: true });
      getStarted.props.style({ pressed: false });
    }
    await press(root, 'Get started');
    expect(navigate).toHaveBeenCalledWith('Register');

    await press(root, 'Already learning? Sign in');
    expect(navigate).toHaveBeenCalledWith('Login');
  });

  it('replaces Welcome with Login when recovery link failed', async () => {
    useAuth.mockReturnValue({
      clearRecoveryLinkError: jest.fn(),
      recoveryLinkError: 'Reset link expired or invalid. Request a new one from Forgot password.',
      user: null,
      profile: null,
      refreshProfile: jest.fn(async () => undefined),
      signOut: jest.fn(async () => undefined),
    });

    await mount(<WelcomeScreen />);
    expect(replace).toHaveBeenCalledWith('Login');
    expect(navigate).not.toHaveBeenCalledWith('Login');
  });

  it('logs in successfully and surfaces failures', async () => {
    const invalid = await mount(<LoginScreen />);
    await press(invalid, 'Sign in');
    await waitFor(
      () => invalid.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'login validation',
    );
    expect(signIn).not.toHaveBeenCalled();

    jest.mocked(signIn).mockResolvedValueOnce({} as never);
    const root = await mount(<LoginScreen />);

    await changeText(root, 'Email', 'ada@example.com');
    await changeText(root, 'Password', 'secret');
    await press(root, 'Sign in');

    expect(signIn).toHaveBeenCalledWith('ada@example.com', 'secret');
    expect(trackEvent).toHaveBeenCalledWith('login_success');

    jest.mocked(signIn).mockRejectedValueOnce(new Error('Invalid email or password.'));
    await press(root, 'Sign in');
    await waitFor(
      () => root.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'login error',
    );
    expect(root.root.findByProps({ accessibilityRole: 'alert' }).props.children).toBe(
      'Invalid email or password.',
    );

    await press(root, 'Create an account');
    expect(navigate).toHaveBeenCalledWith('Register');
  });

  it('opens forgot password from login', async () => {
    const root = await mount(<LoginScreen />);
    await press(root, 'Forgot password');
    expect(navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('registers, handles email confirmation and rate limits', async () => {
    jest.mocked(signUp).mockResolvedValueOnce({ session: null } as never);
    const root = await mount(<RegisterScreen />);

    await changeText(root, 'Email', 'ada@example.com');
    await changeText(root, 'Password', 'secret1');
    await press(root, 'Create account');

    expect(trackEvent).toHaveBeenCalledWith('register_success');
    expect(navigate).toHaveBeenCalledWith('ConfirmSignup', { email: 'ada@example.com' });

    jest
      .mocked(signUp)
      .mockRejectedValueOnce(new AuthUserError('rate_limit', 'Too many attempts right now.'));
    const limited = await mount(<RegisterScreen />);
    await changeText(limited, 'Email', 'ada@example.com');
    await changeText(limited, 'Password', 'secret1');
    await press(limited, 'Create account');
    await waitFor(
      () => limited.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'register error',
    );
    expect(limited.root.findByProps({ accessibilityRole: 'alert' }).props.children).toContain(
      'Too many attempts',
    );
  });

  it('completes a profile for the signed-in user', async () => {
    jest.mocked(upsertProfile).mockResolvedValueOnce({} as never);
    const refreshProfile = jest.fn(async () => undefined);
    useAuth.mockReturnValue({
      user: { id: 'user-1' },
      refreshProfile,
    });
    const root = await mount(<CompleteProfileScreen />);

    await changeText(root, 'Display name', 'Ada Lovelace');
    await press(root, 'Continue');

    expect(upsertProfile).toHaveBeenCalledWith({
      userId: 'user-1',
      displayName: 'Ada Lovelace',
      englishLevel: 'B1',
    });
    expect(trackEvent).toHaveBeenCalledWith('profile_completed');
    expect(refreshProfile).toHaveBeenCalled();
  });

  it('edits an existing profile and retries unavailable state', async () => {
    useProfile.mockReturnValue({
      data: undefined,
      fetchStatus: 'idle',
      refetch: jest.fn(async () => undefined),
    });
    useAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
      refreshProfile: jest.fn(),
    });
    const unavailable = await mount(<EditProfileScreen />);
    expect(
      unavailable.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Profile is unavailable')),
    ).toBe(true);
    await press(unavailable, 'Retry loading profile');

    jest.mocked(upsertProfile).mockResolvedValueOnce({} as never);
    const refreshProfile = jest.fn(async () => undefined);
    useAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: {
        id: 'user-1',
        display_name: 'Ada',
        english_level: 'B2',
        created_at: '',
        updated_at: '',
      },
      refreshProfile,
    });
    useProfile.mockReturnValue({
      data: {
        id: 'user-1',
        display_name: 'Ada',
        english_level: 'B2',
        created_at: '',
        updated_at: '',
      },
      fetchStatus: 'idle',
      refetch: jest.fn(),
    });

    const root = await mount(<EditProfileScreen />);
    await changeText(root, 'Display name', 'Ada Edited');
    await press(root, 'Save profile');
    expect(upsertProfile).toHaveBeenCalledWith({
      userId: 'user-1',
      displayName: 'Ada Edited',
      englishLevel: 'B2',
    });
    expect(goBack).toHaveBeenCalled();
  });

  it('renders home greeting and gated learning paths', async () => {
    const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
      useFeatureFlags: jest.Mock;
    };
    useFeatureFlags.mockReturnValue({
      data: { grammar: false, vocabulary: false, interview: false, ai: false },
    });
    const root = await mount(<HomeScreen />);
    expect(
      root.root.findAllByType(Text).some((node) => String(node.props.children).includes('Ada')),
    ).toBe(true);
    expect(
      root.root.findAllByType(Text).some((node) => {
        const value = String(node.props.children);
        return (
          value.includes('Good morning') ||
          value.includes('Good afternoon') ||
          value.includes('Good evening')
        );
      }),
    ).toBe(true);
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Learning paths')),
    ).toBe(true);
    expect(
      root.root.find(
        (node) =>
          node.props.accessibilityLabel === 'Grammar coming soon' && node.props.disabled === true,
      ).props.accessibilityState,
    ).toEqual({ disabled: true });
    expect(
      root.root.find(
        (node) =>
          node.props.accessibilityLabel === 'Vocabulary coming soon' &&
          node.props.disabled === true,
      ),
    ).toBeTruthy();
  });

  it('opens grammar from home when the flag is enabled', async () => {
    const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
      useFeatureFlags: jest.Mock;
    };
    useFeatureFlags.mockReturnValue({
      data: { grammar: true, vocabulary: false, interview: false, ai: false },
    });
    const root = await mount(<HomeScreen />);
    await press(root, 'Grammar, 0 / 0 topics');
    expect(navigate).toHaveBeenCalledWith('Grammar', { screen: 'GrammarHome' });
  });

  it('opens vocabulary from home when the flag is enabled', async () => {
    const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
      useFeatureFlags: jest.Mock;
    };
    useFeatureFlags.mockReturnValue({
      data: { grammar: false, vocabulary: true, interview: false, ai: false },
    });
    const root = await mount(<HomeScreen />);
    await press(root, 'Vocabulary, 0 / 2500 terms');
    expect(navigate).toHaveBeenCalledWith('Vocabulary', { screen: 'VocabularyHome' });
  });

  it('surfaces complete-profile session and save failures', async () => {
    useAuth.mockReturnValue({ user: null, refreshProfile: jest.fn() });
    const missing = await mount(<CompleteProfileScreen />);
    await press(missing, 'Continue');
    await waitFor(
      () => missing.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'missing session',
    );

    const refreshProfile = jest.fn(async () => undefined);
    useAuth.mockReturnValue({ user: { id: 'user-1' }, refreshProfile });
    jest.mocked(upsertProfile).mockRejectedValueOnce(new Error('save failed'));
    const root = await mount(<CompleteProfileScreen />);
    await changeText(root, 'Display name', 'Ada');
    await press(root, 'Continue');
    await waitFor(
      () => root.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'save error',
    );

    jest.mocked(upsertProfile).mockRejectedValueOnce('nope');
    const stringFail = await mount(<CompleteProfileScreen />);
    await changeText(stringFail, 'Display name', 'Ada');
    await press(stringFail, 'Continue');
    await waitFor(
      () => stringFail.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'string save error',
    );
    expect(stringFail.root.findByProps({ accessibilityRole: 'alert' }).props.children).toBe(
      'Could not save profile',
    );
  });

  it('surfaces edit-profile save failures and loading state', async () => {
    useProfile.mockReturnValue({
      data: undefined,
      fetchStatus: 'fetching',
      refetch: jest.fn(),
    });
    useAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
      refreshProfile: jest.fn(),
    });
    const loading = await mount(<EditProfileScreen />);
    expect(
      loading.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Loading profile')),
    ).toBe(true);

    jest.mocked(upsertProfile).mockRejectedValueOnce(new Error('write failed'));
    useAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: {
        id: 'user-1',
        display_name: 'Ada',
        english_level: 'B2',
        created_at: '',
        updated_at: '',
      },
      refreshProfile: jest.fn(),
    });
    useProfile.mockReturnValue({
      data: {
        id: 'user-1',
        display_name: 'Ada',
        english_level: 'B2',
        created_at: '',
        updated_at: '',
      },
      fetchStatus: 'idle',
      refetch: jest.fn(),
    });
    const root = await mount(<EditProfileScreen />);
    await press(root, 'Save profile');
    await waitFor(
      () => root.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'edit save error',
    );

    useAuth.mockReturnValue({
      user: null,
      profile: {
        id: 'user-1',
        display_name: 'Ada',
        english_level: 'B2',
        created_at: '',
        updated_at: '',
      },
      refreshProfile: jest.fn(),
    });
    const signedOut = await mount(<EditProfileScreen />);
    await press(signedOut, 'Save profile');
    await waitFor(
      () => signedOut.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'edit missing session',
    );

    jest.mocked(upsertProfile).mockRejectedValueOnce('nope');
    useAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: {
        id: 'user-1',
        display_name: 'Ada',
        english_level: 'B2',
        created_at: '',
        updated_at: '',
      },
      refreshProfile: jest.fn(),
    });
    const stringFail = await mount(<EditProfileScreen />);
    await press(stringFail, 'Save profile');
    await waitFor(
      () => stringFail.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'edit string error',
    );
    expect(stringFail.root.findByProps({ accessibilityRole: 'alert' }).props.children).toBe(
      'Could not save profile',
    );
  });

  it('renders settings flows for profile retry, notifications, and sign-out', async () => {
    const refetch = jest.fn(async () => undefined);
    const setEnabled = jest.fn();
    const signOut = jest.fn(async () => undefined);
    useProfile.mockReturnValue({
      data: {
        id: 'user-1',
        display_name: 'Ada',
        english_level: 'B2',
        created_at: '',
        updated_at: '',
      },
      isError: true,
      isFetching: true,
      refetch,
    });
    useNotificationSettings.mockReturnValue({
      preferenceEnabled: true,
      osGranted: true,
      setEnabled,
      isUpdating: false,
    });
    useAuth.mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
      signOut,
    });

    const granted = await mount(<SettingsScreen />);
    expect(
      granted.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Retrying')),
    ).toBe(true);

    useProfile.mockReturnValue({
      data: {
        id: 'user-1',
        display_name: 'Ada',
        english_level: 'B2',
        created_at: '',
        updated_at: '',
      },
      isError: true,
      isFetching: false,
      refetch,
    });
    useNotificationSettings.mockReturnValue({
      preferenceEnabled: true,
      osGranted: false,
      setEnabled,
      isUpdating: false,
    });

    const root = await mount(<SettingsScreen />);
    await press(root, 'Retry loading profile');
    expect(refetch).toHaveBeenCalled();

    await press(root, 'Edit profile');
    expect(navigate).toHaveBeenCalledWith('EditProfile');

    const toggle = root.root.findByProps({
      accessibilityLabel: 'Enable notifications',
      accessibilityRole: 'switch',
    });
    await act(() => {
      toggle.props.onPress();
    });
    expect(setEnabled).toHaveBeenCalledWith(false);

    await press(root, 'Sign out');
    await act(() => {
      root.root.findByProps({ testID: 'confirm-modal-cancel' }).props.onPress();
    });
    await press(root, 'Sign out');
    await act(() => {
      root.root.findByProps({ testID: 'confirm-modal-confirm' }).props.onPress();
    });
    expect(trackEvent).toHaveBeenCalledWith('logout');
    expect(signOut).toHaveBeenCalled();
  });

  it('renders home fallbacks when profile and flags are empty', async () => {
    const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
      useFeatureFlags: jest.Mock;
    };
    useFeatureFlags.mockReturnValue({ data: undefined });
    useProfile.mockReturnValue({ data: undefined });
    useAuth.mockReturnValue({ profile: null, user: { id: 'user-1' } });
    const root = await mount(<HomeScreen />);
    const labels = root.root.findAllByType(Text).map((node) => String(node.props.children));
    expect(labels.some((text) => text.includes('there'))).toBe(true);
    expect(labels.some((text) => text.includes('Learning paths'))).toBe(true);
  });

  it('surfaces non-Error login failures', async () => {
    jest.mocked(signIn).mockRejectedValueOnce('nope');
    const root = await mount(<LoginScreen />);
    await changeText(root, 'Email', 'ada@example.com');
    await changeText(root, 'Password', 'secret1');
    await press(root, 'Sign in');
    await waitFor(
      () => root.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'login string error',
    );
    expect(root.root.findByProps({ accessibilityRole: 'alert' }).props.children).toBe(
      'Login failed',
    );
  });

  it('surfaces non-Error register failures and keeps session present as registered=false', async () => {
    jest.mocked(signUp).mockResolvedValueOnce({ session: { user: { id: 'user-1' } } } as never);
    const withSession = await mount(<RegisterScreen />);
    await changeText(withSession, 'Email', 'ada@example.com');
    await changeText(withSession, 'Password', 'secret1');
    await press(withSession, 'Create account');
    expect(
      withSession.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Check your email')),
    ).toBe(false);

    jest.mocked(signUp).mockRejectedValueOnce('nope');
    const root = await mount(<RegisterScreen />);
    await changeText(root, 'Email', 'ada@example.com');
    await changeText(root, 'Password', 'secret1');
    await press(root, 'Create account');
    await waitFor(
      () => root.root.findAllByProps({ accessibilityRole: 'alert' }).length > 0,
      'register string error',
    );
    expect(root.root.findByProps({ accessibilityRole: 'alert' }).props.children).toBe(
      'Registration failed',
    );
  });
});
