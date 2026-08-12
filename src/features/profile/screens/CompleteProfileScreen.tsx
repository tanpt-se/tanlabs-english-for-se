import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/button';
import { AppFormError } from '@/components/ui/feedback';
import { FieldTextInput } from '@/components/ui/input';
import { ScreenScroll } from '@/components/ui/layout';
import { TopAppHeader } from '@/components/ui/navigation';
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
        <Text style={[styles.step, { color: colors.primary }]}>Final step</Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary }]} />
        </View>
        <Text accessibilityRole="header" style={[styles.headline, { color: colors.text }]}>
          Personalise your learning path
        </Text>
        <FieldTextInput
          accessibilityLabel="Display name"
          aria-describedby={error ? 'complete-profile-form-error' : undefined}
          aria-invalid={Boolean(error)}
          label="Display name"
          placeholder="How should we greet you?"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Text style={[styles.sectionLabel, { color: colors.text }]}>English level</Text>
        <EnglishLevelPicker value={englishLevel} onChange={setEnglishLevel} />
        {error ? <AppFormError nativeID="complete-profile-form-error" message={error} /> : null}
        <AppButton
          accessibilityLabel="Continue"
          accessibilityRole="button"
          disabled={loading}
          fullWidth
          label={loading ? 'Saving…' : 'Continue'}
          onPress={onSubmit}
        />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
  },
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  stack: {
    gap: themeTokens.spacing['14'],
    width: '100%',
  },
  step: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});
