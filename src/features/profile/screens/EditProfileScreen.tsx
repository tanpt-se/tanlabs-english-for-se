import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppStackParamList } from '@/app/navigation/types';
import { AppButton } from '@/components/ui/button';
import { AppFormError } from '@/components/ui/feedback';
import { FieldTextInput } from '@/components/ui/input';
import { ScreenScroll } from '@/components/ui/layout';
import { TopAppHeader } from '@/components/ui/navigation';
import { useAuth } from '@/core/auth/AuthProvider';
import { upsertProfile } from '@/core/profile/service';
import { ENGLISH_LEVELS } from '@/core/profile/validation';
import { EnglishLevelPicker } from '@/features/profile/components';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { themeTokens, useAppColors } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const { data: queriedProfile, fetchStatus, refetch } = useProfile();
  const queryClient = useQueryClient();
  const profile = queriedProfile ?? authProfile;

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [englishLevel, setEnglishLevel] = useState<(typeof ENGLISH_LEVELS)[number]>(
    (profile?.english_level as (typeof ENGLISH_LEVELS)[number]) ?? 'B1',
  );
  const [profileHydrated, setProfileHydrated] = useState(Boolean(profile));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const colors = useAppColors();

  useEffect(() => {
    if (!profileHydrated && profile) {
      setDisplayName(profile.display_name);
      setEnglishLevel(profile.english_level as (typeof ENGLISH_LEVELS)[number]);
      setProfileHydrated(true);
    }
  }, [profile, profileHydrated]);

  if (!profileHydrated) {
    const isFetchingProfile = fetchStatus === 'fetching';
    return (
      <ScreenScroll>
        <View style={styles.stack}>
          <TopAppHeader showBack title="Edit profile" onBackPress={() => navigation.goBack()} />
          <Text style={{ color: colors.text }}>
            {isFetchingProfile
              ? 'Loading profile…'
              : 'Profile is unavailable. Reconnect to the internet and try again.'}
          </Text>
          {!isFetchingProfile ? (
            <AppButton
              accessibilityLabel="Retry loading profile"
              accessibilityRole="button"
              fullWidth
              onPress={() => {
                refetch().catch(() => undefined);
              }}
              label="Retry"
            />
          ) : null}
        </View>
      </ScreenScroll>
    );
  }

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
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      await refreshProfile();
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll>
      <View style={styles.stack}>
        <TopAppHeader showBack title="Edit profile" onBackPress={() => navigation.goBack()} />
        <Text style={[styles.step, { color: colors.primary }]}>Account settings</Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.borderSubtle }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary }]} />
        </View>
        <Text accessibilityRole="header" style={[styles.headline, { color: colors.text }]}>
          Update how we greet you.
        </Text>
        <FieldTextInput
          accessibilityLabel="Display name"
          aria-describedby={error ? 'edit-profile-form-error' : undefined}
          aria-invalid={Boolean(error)}
          label="Display name"
          placeholder="Display name"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Text style={[styles.sectionLabel, { color: colors.text }]}>English level</Text>
        <EnglishLevelPicker value={englishLevel} onChange={setEnglishLevel} />
        {error ? <AppFormError nativeID="edit-profile-form-error" message={error} /> : null}
        <AppButton
          accessibilityLabel="Save profile"
          accessibilityRole="button"
          disabled={loading}
          fullWidth
          label={loading ? 'Saving…' : 'Save profile'}
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
