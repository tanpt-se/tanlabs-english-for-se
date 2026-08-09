import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthStackParamList } from '@/app/navigation/types';
import { AppButton, AppFormError, AppTextInput } from '@/components/ui/AppControls';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { trackEvent } from '@/core/analytics/events';
import { isAuthRateLimitError } from '@/core/auth/errors';
import { signUp } from '@/core/auth/service';
import { validateAuthCredentials } from '@/core/auth/validation';
import { useAppColors } from '@/theme';

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
    <ScreenScroll centered>
      <AuthHeader title="Create account" subtitle="Use an email address you can verify." />
      <View style={styles.stack}>
        <AppTextInput
          accessibilityLabel="Email"
          aria-describedby={error ? 'register-form-error' : undefined}
          aria-invalid={Boolean(error)}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <AppTextInput
          accessibilityLabel="Password"
          aria-describedby={error ? 'register-form-error' : undefined}
          aria-invalid={Boolean(error)}
          placeholder="Password (min 6)"
          secureTextEntry
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
          accessibilityLabel="Register"
          accessibilityRole="button"
          onPress={onSubmit}
          disabled={loading}
          label={loading ? 'Creating…' : 'Register'}
        />
        {rateLimited || registered ? (
          <AppButton
            accessibilityLabel="Sign in instead"
            accessibilityRole="button"
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
          <Text style={[styles.linkText, { color: colors.primary }]}>Already have an account?</Text>
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
    gap: 16,
  },
});
