import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/button';
import { AppFormError } from '@/components/ui/feedback';
import { FieldTextInput } from '@/components/ui/input';
import { ScreenScroll } from '@/components/ui/layout';
import { TopAppHeader } from '@/components/ui/navigation';
import { AppText } from '@/components/ui/typography';
import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import { upsertProfile } from '@/core/profile/service';
import { ENGLISH_LEVELS } from '@/core/profile/validation';
import { EnglishLevelPicker } from '@/features/profile/components';
import { themeTokens, useAppColors } from '@/theme';

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
    <ScreenScroll header={<TopAppHeader title="Complete your profile" />}>
      <View style={styles.stack}>
        <AppText color={colors.primary} variant="caption" weight="500">
          Final step
        </AppText>
        <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary }]} />
        </View>
        <AppText accessibilityRole="header" variant="h2">
          Personalise your learning path
        </AppText>
        <FieldTextInput
          accessibilityLabel="Display name"
          aria-describedby={error ? 'complete-profile-form-error' : undefined}
          aria-invalid={Boolean(error)}
          label="Display name"
          placeholder="How should we greet you?"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <AppText variant="bodySmall" weight="500">
          English level
        </AppText>
        <EnglishLevelPicker value={englishLevel} onChange={setEnglishLevel} />
        {error ? <AppFormError nativeID="complete-profile-form-error" message={error} /> : null}
        <AppButton
          accessibilityLabel="Continue"
          fullWidth
          label="Continue"
          loading={loading}
          variant="primary"
          onPress={onSubmit}
        />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  progressFill: {
    borderRadius: 3,
    height: 6,
    width: '66%',
  },
  progressTrack: {
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  stack: {
    gap: themeTokens.spacing.md,
    width: '100%',
  },
});
