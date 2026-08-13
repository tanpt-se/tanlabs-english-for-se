import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import type { AuthStackParamList } from '@/app/navigation/types';
import { AppButton } from '@/components/ui/button';
import { AppFormError } from '@/components/ui/feedback';
import { trackEvent } from '@/core/analytics/events';
import { isAuthRateLimitError } from '@/core/auth/errors';
import { resendSignupOtp, verifySignupOtp } from '@/core/auth/service';
import { validateSignupOtp } from '@/core/auth/validation';
import { AuthFormScreen, AuthNote, OtpPinInput } from '@/features/auth/components';
import { authFormStyles } from '@/features/auth/components/authFormStyles';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function ConfirmSignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, 'ConfirmSignup'>>();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const email = route.params.email;

  const onVerify = async () => {
    const validationError = validateSignupOtp(otp);
    if (validationError) {
      setError(validationError);
      setRateLimited(false);
      return;
    }
    setLoading(true);
    setError(null);
    setRateLimited(false);
    try {
      await verifySignupOtp(email, otp);
      await trackEvent('register_confirmed');
    } catch (err) {
      setRateLimited(isAuthRateLimitError(err));
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    setError(null);
    setRateLimited(false);
    try {
      await resendSignupOtp(email);
      setResent(true);
    } catch (err) {
      setRateLimited(isAuthRateLimitError(err));
      setError(err instanceof Error ? err.message : 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthFormScreen
      subtitle={`Enter the 6-digit code sent to ${email}.`}
      title="Confirm your email"
    >
      <View style={authFormStyles.form}>
        <View style={authFormStyles.fields}>
          <OtpPinInput
            accessibilityLabel="Verification code"
            aria-describedby={error ? 'confirm-signup-form-error' : undefined}
            aria-invalid={Boolean(error)}
            error={Boolean(error)}
            showLabel
            testID="confirm-signup-otp"
            value={otp}
            onChange={setOtp}
          />
          {error ? <AppFormError nativeID="confirm-signup-form-error" message={error} /> : null}
          {resent ? (
            <AuthNote accessibilityLiveRegion="polite">A new code was sent to your email.</AuthNote>
          ) : null}
        </View>
        <View style={authFormStyles.actions}>
          <AppButton
            accessibilityLabel="Verify email"
            fullWidth
            label="Verify email"
            loading={loading}
            testID="confirm-signup-submit"
            variant="primary"
            onPress={onVerify}
          />
          <AppButton
            accessibilityLabel="Resend code"
            disabled={resending || rateLimited}
            fullWidth
            label="Resend code"
            loading={resending}
            testID="confirm-signup-resend"
            variant="secondary"
            onPress={onResend}
          />
          <AppButton
            accessibilityLabel="Back to sign in"
            fullWidth
            label="Back to sign in"
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    </AuthFormScreen>
  );
}
