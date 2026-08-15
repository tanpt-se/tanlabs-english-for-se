import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import type { AuthStackParamList } from '@/app/navigation/types';
import { AppButton } from '@/components/ui/button';
import { AppFormError } from '@/components/ui/feedback';
import { FieldTextInput } from '@/components/ui/input';
import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import { signIn } from '@/core/auth/service';
import { validateAuthCredentials } from '@/core/auth/validation';
import { AuthFormScreen } from '@/features/auth/components';
import { authFormStyles } from '@/features/auth/components/authFormStyles';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { clearPasswordRecovery, clearRecoveryLinkError, recoveryLinkError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formError = error ?? recoveryLinkError;
  const formErrorId = formError ? 'login-form-error' : undefined;

  useEffect(() => {
    if (recoveryLinkError) {
      setError(null);
    }
  }, [recoveryLinkError]);

  const onSubmit = async () => {
    const validationError = validateAuthCredentials(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      // Successful password login leaves recovery mode / reset-link errors behind.
      await clearPasswordRecovery();
      clearRecoveryLinkError();
      await trackEvent('login_success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormScreen subtitle="Sign in to continue learning." title="Welcome back">
      <View style={authFormStyles.form}>
        <View style={authFormStyles.fields}>
          <FieldTextInput
            testID="login-email"
            accessibilityLabel="Email"
            aria-describedby={formErrorId}
            aria-invalid={Boolean(error)}
            autoCapitalize="none"
            autoComplete="email"
            error={Boolean(error)}
            keyboardType="email-address"
            label="Email"
            placeholder="you@example.com"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <FieldTextInput
            testID="login-password"
            accessibilityLabel="Password"
            aria-describedby={formErrorId}
            aria-invalid={Boolean(error)}
            autoComplete="password"
            error={Boolean(error)}
            label="Password"
            mode="password"
            placeholder="Password"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
          />
          {formError ? <AppFormError nativeID="login-form-error" message={formError} /> : null}
        </View>
        <View style={authFormStyles.actions}>
          <AppButton
            accessibilityLabel="Forgot password"
            fullWidth
            label="Forgot password?"
            testID="login-forgot-password"
            variant="ghost"
            onPress={() => navigation.navigate('ForgotPassword')}
          />
          <AppButton
            testID="login-submit"
            accessibilityLabel="Sign in"
            fullWidth
            label="Sign in"
            loading={loading}
            variant="primary"
            onPress={onSubmit}
          />
          <AppButton
            accessibilityLabel="Create an account"
            fullWidth
            label="Create an account"
            variant="ghost"
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      </View>
    </AuthFormScreen>
  );
}
