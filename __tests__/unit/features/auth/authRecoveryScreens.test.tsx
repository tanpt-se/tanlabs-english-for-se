import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AuthUserError } from '@/core/auth/errors';
import {
  requestPasswordReset,
  resendSignupOtp,
  updatePassword,
  verifySignupOtp,
} from '@/core/auth/service';
import { AuthNote } from '@/features/auth/components';
import { ConfirmSignupScreen } from '@/features/auth/screens/ConfirmSignupScreen';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';
import { SetNewPasswordScreen } from '@/features/auth/screens/SetNewPasswordScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
    useRoute: jest.fn(),
  };
});

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    clearPasswordRecovery: jest.fn(),
    recoveryLinkError: null,
    signOut: jest.fn(async () => undefined),
  })),
}));

jest.mock('@/core/auth/service', () => ({
  verifySignupOtp: jest.fn(),
  resendSignupOtp: jest.fn(),
  requestPasswordReset: jest.fn(),
  updatePassword: jest.fn(),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

const navigate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useNavigation).mockReturnValue({ navigate } as never);
});

async function press(root: ReactTestRenderer.ReactTestRenderer, label: string) {
  const target = root.root.find(
    (node) => node.props.accessibilityLabel === label || node.props.testID === label,
  );
  await act(async () => {
    target.props.onPress?.();
    await Promise.resolve();
  });
}

describe('auth recovery screens', () => {
  it('shows validation error for incomplete signup OTP', async () => {
    jest.mocked(useRoute).mockReturnValue({ params: { email: 'ada@example.com' } } as never);

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<ConfirmSignupScreen />);
    });

    await press(root, 'Verify email');
    expect(verifySignupOtp).not.toHaveBeenCalled();
    expect(root.root.findByProps({ nativeID: 'confirm-signup-form-error' })).toBeTruthy();
  });

  it('handles signup verify failures and resend flows', async () => {
    jest.mocked(useRoute).mockReturnValue({ params: { email: 'ada@example.com' } } as never);
    jest
      .mocked(verifySignupOtp)
      .mockRejectedValueOnce(new AuthUserError('rate_limit', 'Too many attempts'))
      .mockRejectedValueOnce(new Error('boom'));
    jest.mocked(resendSignupOtp).mockResolvedValueOnce({} as never);

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<ConfirmSignupScreen />);
    });

    const otp = root.root.findByType(TextInput);
    await act(() => {
      otp.props.onChangeText('123456');
    });
    await press(root, 'Verify email');
    await press(root, 'Verify email');

    await press(root, 'Resend code');
    expect(resendSignupOtp).toHaveBeenCalledWith('ada@example.com');
    expect(root.root.findAllByProps({ accessibilityLiveRegion: 'polite' }).length).toBeGreaterThan(
      0,
    );

    await press(root, 'Back to sign in');
    expect(navigate).toHaveBeenCalledWith('Login');
  });

  it('handles resend OTP failure', async () => {
    jest.mocked(useRoute).mockReturnValue({ params: { email: 'ada@example.com' } } as never);
    jest
      .mocked(resendSignupOtp)
      .mockRejectedValueOnce(new AuthUserError('rate_limit', 'Too many attempts'));

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<ConfirmSignupScreen />);
    });

    await press(root, 'Resend code');
    expect(root.root.findByProps({ nativeID: 'confirm-signup-form-error' })).toBeTruthy();
  });

  it('verifies signup OTP from route email', async () => {
    jest.mocked(useRoute).mockReturnValue({ params: { email: 'ada@example.com' } } as never);
    jest.mocked(verifySignupOtp).mockResolvedValueOnce({ session: {} } as never);

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<ConfirmSignupScreen />);
    });

    const otp = root.root.findByType(TextInput);
    await act(() => {
      otp.props.onChangeText('123456');
    });
    await press(root, 'Verify email');

    expect(verifySignupOtp).toHaveBeenCalledWith('ada@example.com', '123456');
  });

  it('validates forgot-password email and handles failures', async () => {
    jest
      .mocked(requestPasswordReset)
      .mockRejectedValueOnce(new AuthUserError('rate_limit', 'Slow down'));

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<ForgotPasswordScreen />);
    });

    await press(root, 'Send reset link');
    expect(requestPasswordReset).not.toHaveBeenCalled();

    const email = root.root.findByProps({ testID: 'forgot-password-email' });
    await act(() => {
      email.props.onChangeText('ada@example.com');
    });
    await press(root, 'Send reset link');
    expect(root.root.findByProps({ nativeID: 'forgot-password-form-error' })).toBeTruthy();

    jest.mocked(requestPasswordReset).mockRejectedValueOnce(new Error('mail down'));
    await press(root, 'Send reset link');
    expect(root.root.findByProps({ nativeID: 'forgot-password-form-error' })).toBeTruthy();

    jest.mocked(requestPasswordReset).mockResolvedValueOnce({} as never);
    await press(root, 'Send reset link');
    expect(root.root.findAllByType(AuthNote).length).toBeGreaterThan(0);

    await press(root, 'Back to sign in');
    expect(navigate).toHaveBeenCalledWith('Login');
  });

  it('sends password reset email', async () => {
    jest.mocked(requestPasswordReset).mockResolvedValueOnce({} as never);

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<ForgotPasswordScreen />);
    });

    const email = root.root.findByProps({ testID: 'forgot-password-email' });
    await act(() => {
      email.props.onChangeText('ada@example.com');
    });
    await press(root, 'Send reset link');

    expect(requestPasswordReset).toHaveBeenCalledWith('ada@example.com');
  });

  it('validates password mismatch and update failures', async () => {
    const clearPasswordRecovery = jest.fn();
    const { useAuth } = jest.requireMock('@/core/auth/AuthProvider') as {
      useAuth: jest.Mock;
    };
    useAuth.mockReturnValue({ clearPasswordRecovery, signOut: jest.fn() });
    jest.mocked(updatePassword).mockRejectedValueOnce(new Error('weak password'));

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<SetNewPasswordScreen />);
    });

    const password = root.root.findByProps({ testID: 'set-password-new' });
    const confirm = root.root.findByProps({ testID: 'set-password-confirm' });
    await act(() => {
      password.props.onChangeText('secret12');
      confirm.props.onChangeText('different');
    });
    await press(root, 'Save new password');
    expect(updatePassword).not.toHaveBeenCalled();

    await act(() => {
      confirm.props.onChangeText('secret12');
    });
    await press(root, 'Save new password');
    expect(root.root.findByProps({ nativeID: 'set-password-form-error' })).toBeTruthy();
    expect(clearPasswordRecovery).not.toHaveBeenCalled();
  });

  it('updates password and clears recovery', async () => {
    const clearPasswordRecovery = jest.fn();
    const { useAuth } = jest.requireMock('@/core/auth/AuthProvider') as {
      useAuth: jest.Mock;
    };
    useAuth.mockReturnValue({ clearPasswordRecovery, signOut: jest.fn() });
    jest.mocked(updatePassword).mockResolvedValueOnce({ user: {} } as never);

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<SetNewPasswordScreen />);
    });

    const password = root.root.findByProps({ testID: 'set-password-new' });
    const confirm = root.root.findByProps({ testID: 'set-password-confirm' });
    await act(() => {
      password.props.onChangeText('secret12');
      confirm.props.onChangeText('secret12');
    });
    await press(root, 'Save new password');

    expect(updatePassword).toHaveBeenCalledWith('secret12');
    expect(clearPasswordRecovery).toHaveBeenCalled();
  });

  it('surfaces sign-out failure on set password back action', async () => {
    const signOut = jest.fn(async () => {
      throw new Error('sign-out failed');
    });
    const { useAuth } = jest.requireMock('@/core/auth/AuthProvider') as {
      useAuth: jest.Mock;
    };
    useAuth.mockReturnValue({ clearPasswordRecovery: jest.fn(), signOut });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<SetNewPasswordScreen />);
    });

    await press(root, 'Back to sign in');
    expect(root.root.findByProps({ nativeID: 'set-password-form-error' })).toBeTruthy();
  });

  it('signs out from set password via back to sign in', async () => {
    const signOut = jest.fn(async () => undefined);
    const { useAuth } = jest.requireMock('@/core/auth/AuthProvider') as {
      useAuth: jest.Mock;
    };
    useAuth.mockReturnValue({ clearPasswordRecovery: jest.fn(), signOut });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<SetNewPasswordScreen />);
    });

    await press(root, 'Back to sign in');
    expect(signOut).toHaveBeenCalled();
  });
});
