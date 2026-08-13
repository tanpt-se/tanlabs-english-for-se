import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { View } from 'react-native';

import type { AuthStackParamList } from '@/app/navigation/types';
import { AppButton } from '@/components/ui/button';
import { AppFormError } from '@/components/ui/feedback';
import { FieldTextInput } from '@/components/ui/input';
import { isAuthRateLimitError } from '@/core/auth/errors';
import { requestPasswordReset } from '@/core/auth/service';
import { validateEmailOnly } from '@/core/auth/validation';
import { AuthFormScreen, AuthNote } from '@/features/auth/components';
import { authFormStyles } from '@/features/auth/components/authFormStyles';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    const validationError = validateEmailOnly(email);
    if (validationError) {
      setError(validationError);
      setRateLimited(false);
      return;
    }
    setLoading(true);
    setError(null);
    setRateLimited(false);
    setSent(false);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setRateLimited(isAuthRateLimitError(err));
      setError(err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormScreen
      subtitle="We will email a link that opens the app to set a new password."
      title="Reset your password"
    >
      <View style={authFormStyles.form}>
        <View style={authFormStyles.fields}>
          <FieldTextInput
            accessibilityLabel="Email"
            aria-describedby={error ? 'forgot-password-form-error' : undefined}
            aria-invalid={Boolean(error)}
            autoCapitalize="none"
            autoComplete="email"
            error={Boolean(error)}
            keyboardType="email-address"
            label="Email"
            placeholder="you@example.com"
            testID="forgot-password-email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          {error ? <AppFormError nativeID="forgot-password-form-error" message={error} /> : null}
          {sent ? <AuthNote>Reset link sent. Open it on this device to continue.</AuthNote> : null}
        </View>
        <View style={authFormStyles.actions}>
          <AppButton
            accessibilityLabel="Send reset link"
            disabled={rateLimited}
            fullWidth
            label="Send reset link"
            loading={loading}
            testID="forgot-password-submit"
            variant="primary"
            onPress={onSubmit}
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
