import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthStackParamList } from '@/app/navigation/types';
import { AppButton } from '@/components/ui/button';
import { AppFormError } from '@/components/ui/feedback';
import { FieldTextInput } from '@/components/ui/input';
import { ScreenScroll } from '@/components/ui/layout';
import { trackEvent } from '@/core/analytics/events';
import { isAuthRateLimitError } from '@/core/auth/errors';
import { signUp } from '@/core/auth/service';
import { validateAuthCredentials } from '@/core/auth/validation';
import { AuthHeader } from '@/features/auth/components';
import { themeTokens, useAppColors } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const colors = useAppColors();

  const onSubmit = async () => {
    const validationError = validateAuthCredentials(email, password);
    if (validationError) {
      setError(validationError);
      setRateLimited(false);
      return;
    }
    setLoading(true);
    setError(null);
    setRateLimited(false);
    setRegistered(false);
    try {
      const result = await signUp(email, password);
      await trackEvent('register_success');
      setRegistered(!result.session);
    } catch (err) {
      setRateLimited(isAuthRateLimitError(err));
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll
      centered
      header={
        <AuthHeader title="Create your account" subtitle="Use an email address you can verify." />
      }
    >
      <View style={styles.stack}>
        <FieldTextInput
          accessibilityLabel="Email"
          aria-describedby={error ? 'register-form-error' : undefined}
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
          accessibilityLabel="Password"
          aria-describedby={error ? 'register-form-error' : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="new-password"
          error={Boolean(error)}
          helper="At least 6 characters"
          label="Password"
          mode="password"
          placeholder="Password"
          textContentType="newPassword"
          value={password}
          onChangeText={setPassword}
        />
        {error ? <AppFormError nativeID="register-form-error" message={error} /> : null}
        {registered ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.text }}>
            Check your email to confirm your account, then sign in.
          </Text>
        ) : null}
        <AppButton
          accessibilityLabel="Create account"
          accessibilityRole="button"
          disabled={loading}
          fullWidth
          label={loading ? 'Creating…' : 'Create account'}
          onPress={onSubmit}
        />
        {rateLimited || registered ? (
          <AppButton
            accessibilityLabel="Sign in instead"
            accessibilityRole="button"
            fullWidth
            variant="outline"
            onPress={() => navigation.navigate('Login')}
            label="Sign in instead"
          />
        ) : null}
        <Pressable
          accessibilityLabel="Already have an account? Sign in"
          accessibilityRole="link"
          style={styles.link}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Already have an account? Sign in
          </Text>
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
