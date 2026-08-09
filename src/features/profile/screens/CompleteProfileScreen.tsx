import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppFormError, AppTextInput } from '@/components/ui/AppControls';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import { upsertProfile } from '@/core/profile/service';
import { ENGLISH_LEVELS } from '@/core/profile/validation';
import { EnglishLevelPicker } from '@/features/profile/components/EnglishLevelPicker';
import { useAppColors } from '@/theme';

export function CompleteProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [englishLevel, setEnglishLevel] = useState<(typeof ENGLISH_LEVELS)[number]>('B1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const colors = useAppColors();

  const onSubmit = async () => {
    if (!user?.id) {
      setError('Missing session.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsertProfile({
        userId: user.id,
        displayName,
        englishLevel,
      });
      await trackEvent('profile_completed');
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll centered>
      <AuthHeader title="Complete profile" subtitle="Tell us how to greet you." />
      <View style={styles.stack}>
        <AppTextInput
          accessibilityLabel="Display name"
          aria-describedby={error ? 'complete-profile-form-error' : undefined}
          aria-invalid={Boolean(error)}
          placeholder="Display name"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Text accessibilityRole="header" style={[styles.label, { color: colors.text }]}>
          English level
        </Text>
        <EnglishLevelPicker value={englishLevel} onChange={setEnglishLevel} />
        {error ? <AppFormError nativeID="complete-profile-form-error" message={error} /> : null}
        <AppButton
          accessibilityLabel="Continue"
          accessibilityRole="button"
          onPress={onSubmit}
          disabled={loading}
          label={loading ? 'Saving…' : 'Continue'}
        />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  stack: {
    gap: 16,
  },
});
