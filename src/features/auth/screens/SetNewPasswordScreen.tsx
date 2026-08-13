import { useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/ui/button';
import { AppFormError } from '@/components/ui/feedback';
import { FieldTextInput } from '@/components/ui/input';
import { useAuth } from '@/core/auth/AuthProvider';
import { updatePassword } from '@/core/auth/service';
import { validateNewPassword } from '@/core/auth/validation';
import { AuthFormScreen, AuthNote } from '@/features/auth/components';
import { authFormStyles } from '@/features/auth/components/authFormStyles';

export function SetNewPasswordScreen() {
  const { clearPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const onBackToSignIn = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out');
    } finally {
      setSigningOut(false);
    }
  };

  const onSubmit = async () => {
    const validationError = validateNewPassword(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      clearPasswordRecovery();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormScreen
      subtitle="Choose a password with at least 6 characters."
      title="Set a new password"
    >
      <View style={authFormStyles.form}>
        <View style={authFormStyles.fields}>
          <FieldTextInput
            accessibilityLabel="New password"
            aria-describedby={error ? 'set-password-form-error' : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="new-password"
            error={Boolean(error)}
            label="New password"
            mode="password"
            placeholder="New password"
            testID="set-password-new"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
          />
          <FieldTextInput
            accessibilityLabel="Confirm password"
            aria-describedby={error ? 'set-password-form-error' : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="new-password"
            error={Boolean(error)}
            label="Confirm password"
            mode="password"
            placeholder="Confirm password"
            testID="set-password-confirm"
            textContentType="newPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {error ? <AppFormError nativeID="set-password-form-error" message={error} /> : null}
          <AuthNote>After saving, you will continue into the app.</AuthNote>
        </View>
        <View style={authFormStyles.actions}>
          <AppButton
            accessibilityLabel="Save new password"
            disabled={signingOut}
            fullWidth
            label="Save new password"
            loading={loading}
            testID="set-password-submit"
            variant="primary"
            onPress={onSubmit}
          />
          <AppButton
            accessibilityLabel="Back to sign in"
            disabled={signingOut || loading}
            fullWidth
            label={signingOut ? 'Signing out…' : 'Back to sign in'}
            variant="ghost"
            onPress={onBackToSignIn}
          />
        </View>
      </View>
    </AuthFormScreen>
  );
}
