import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthStackParamList } from '@/app/navigation/types';
import { AppButton, AppFormError, AppTextInput } from '@/components/ui/AppControls';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { trackEvent } from '@/core/analytics/events';
import { signIn } from '@/core/auth/service';
import { validateAuthCredentials } from '@/core/auth/validation';
import { useAppColors } from '@/theme';

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
    <ScreenScroll centered>
      <AuthHeader title="Sign in" subtitle="Continue your SE English practice." />
      <View style={styles.stack}>
        <AppTextInput
          testID="login-email"
          accessibilityLabel="Email"
          aria-describedby={error ? 'login-form-error' : undefined}
          aria-invalid={Boolean(error)}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <AppTextInput
          testID="login-password"
          accessibilityLabel="Password"
          aria-describedby={error ? 'login-form-error' : undefined}
          aria-invalid={Boolean(error)}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <AppFormError nativeID="login-form-error" message={error} /> : null}
        <AppButton
          testID="login-submit"
          accessibilityLabel="Sign in"
          accessibilityRole="button"
          onPress={onSubmit}
          disabled={loading}
          label={loading ? 'Signing in…' : 'Sign in'}
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
    gap: 16,
  },
});
