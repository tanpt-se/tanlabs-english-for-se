import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthStackParamList } from '@/app/navigation/types';
import { AppButton } from '@/components/ui/button';
import { AppFormError } from '@/components/ui/feedback';
import { FieldTextInput } from '@/components/ui/input';
import { ScreenScroll } from '@/components/ui/layout';
import { trackEvent } from '@/core/analytics/events';
import { signIn } from '@/core/auth/service';
import { validateAuthCredentials } from '@/core/auth/validation';
import { AuthHeader } from '@/features/auth/components';
import { themeTokens, useAppColors } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const colors = useAppColors();

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
      await trackEvent('login_success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll
      centered
      header={<AuthHeader title="Welcome back" subtitle="Sign in to continue learning." />}
    >
      <View style={styles.stack}>
        <FieldTextInput
          testID="login-email"
          accessibilityLabel="Email"
          aria-describedby={error ? 'login-form-error' : undefined}
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
          aria-describedby={error ? 'login-form-error' : undefined}
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
        {error ? <AppFormError nativeID="login-form-error" message={error} /> : null}
        <AppButton
          testID="login-submit"
          accessibilityLabel="Sign in"
          accessibilityRole="button"
          disabled={loading}
          fullWidth
          label={loading ? 'Signing in…' : 'Sign in'}
          onPress={onSubmit}
        />
        <Pressable
          accessibilityLabel="Create an account"
          accessibilityRole="link"
          style={styles.link}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>Create an account</Text>
        </Pressable>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  link: {
    justifyContent: 'center',
    minHeight: 44,
  },
  linkText: {
    textAlign: 'center',
  },
  stack: {
    gap: themeTokens.spacing.md,
    width: '100%',
  },
});
