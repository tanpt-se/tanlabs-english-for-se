import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AppStackParamList } from '@/app/navigation/types';
import { AppButton, AppFormError, AppTextInput } from '@/components/ui/AppControls';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useAuth } from '@/core/auth/AuthProvider';
import { upsertProfile } from '@/core/profile/service';
import { ENGLISH_LEVELS } from '@/core/profile/validation';
import { EnglishLevelPicker } from '@/features/profile/components/EnglishLevelPicker';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useAppColors } from '@/theme';

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
        <AuthHeader title="Edit profile" subtitle="Update how we greet you." />
        <View style={styles.stack}>
          <Text style={{ color: colors.text }}>
            {isFetchingProfile
              ? 'Loading profile…'
              : 'Profile is unavailable. Reconnect to the internet and try again.'}
          </Text>
          {!isFetchingProfile ? (
            <AppButton
              accessibilityLabel="Retry loading profile"
              accessibilityRole="button"
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
      <AuthHeader title="Edit profile" subtitle="Update how we greet you." />
      <View style={styles.stack}>
        <AppTextInput
          accessibilityLabel="Display name"
          aria-describedby={error ? 'edit-profile-form-error' : undefined}
          aria-invalid={Boolean(error)}
          placeholder="Display name"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Text accessibilityRole="header" style={[styles.label, { color: colors.text }]}>
          English level
        </Text>
        <EnglishLevelPicker value={englishLevel} onChange={setEnglishLevel} />
        {error ? <AppFormError nativeID="edit-profile-form-error" message={error} /> : null}
        <AppButton
          accessibilityLabel="Save profile"
          accessibilityRole="button"
          onPress={onSubmit}
          disabled={loading}
          label={loading ? 'Saving…' : 'Save'}
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
