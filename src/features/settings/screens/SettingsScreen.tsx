import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Linking, StyleSheet, Switch, Text, View } from 'react-native';

import type { AppStackParamList } from '@/app/navigation/types';
import { AppButton } from '@/components/ui/AppControls';
import { ProfileSection } from '@/components/ui/ProfileSection';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SettingRow } from '@/components/ui/SettingRow';
import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import { triggerTestCrash } from '@/core/monitoring/crashlytics';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useNotificationSettings } from '@/features/settings/hooks/useNotificationSettings';
import { useAppColors } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { signOut } = useAuth();
  const { data: profile, isError, refetch, isFetching } = useProfile();
  const { preferenceEnabled, osGranted, setEnabled, isUpdating } = useNotificationSettings();
  const [busy, setBusy] = useState(false);
  const colors = useAppColors();

  const onSignOut = async () => {
    setBusy(true);
    try {
      await trackEvent('logout');
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScroll>
      <View style={styles.stack}>
        <ProfileSection title="Profile">
          <SettingRow label="Display name" value={profile?.display_name ?? '—'} />
          <SettingRow label="English level" value={profile?.english_level ?? '—'} />
          {isError ? (
            <View style={styles.sectionPadding}>
              <Text style={{ color: colors.danger }}>Could not load profile.</Text>
              <AppButton
                accessibilityLabel="Retry loading profile"
                accessibilityRole="button"
                variant="outline"
                style={styles.buttonSpacing}
                onPress={() => refetch()}
                disabled={isFetching}
                label={isFetching ? 'Retrying…' : 'Retry'}
              />
            </View>
          ) : null}
          <View style={styles.sectionBottom}>
            <AppButton
              accessibilityLabel="Edit profile"
              accessibilityRole="button"
              variant="outline"
              onPress={() => navigation.navigate('EditProfile')}
              label="Edit profile"
            />
          </View>
        </ProfileSection>

        <ProfileSection
          title="Notifications"
          description="Preference syncs to Supabase when signed in."
        >
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Enable notifications</Text>
            <Switch
              accessibilityLabel="Enable notifications"
              accessibilityRole="switch"
              value={preferenceEnabled}
              onValueChange={(value: boolean) => setEnabled(value)}
              disabled={isUpdating}
            />
          </View>
          {preferenceEnabled && !osGranted ? (
            <View style={styles.sectionBottom}>
              <Text style={[styles.helpText, { color: colors.textMuted }]}>
                Notifications are blocked in system settings. Enable them there to receive alerts,
                or turn the preference off above.
              </Text>
              <AppButton
                accessibilityLabel="Open system notification settings"
                accessibilityRole="button"
                variant="outline"
                onPress={() => {
                  Linking.openSettings().catch(() => undefined);
                }}
                label="Open system settings"
              />
            </View>
          ) : null}
        </ProfileSection>

        {__DEV__ ? (
          <ProfileSection title="Developer" description="PH1 Firebase Console verification only.">
            <View style={styles.sectionBottom}>
              <AppButton
                accessibilityLabel="Trigger test crash for Crashlytics"
                accessibilityRole="button"
                variant="outline"
                tone="danger"
                onPress={() => triggerTestCrash()}
                label="Trigger test crash"
              />
            </View>
          </ProfileSection>
        ) : null}

        <AppButton
          testID="settings-sign-out"
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          tone="danger"
          onPress={onSignOut}
          disabled={busy}
          label={busy ? 'Signing out…' : 'Sign out'}
        />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  buttonSpacing: {
    marginTop: 8,
  },
  helpText: {
    fontSize: 14,
    marginBottom: 8,
  },
  sectionBottom: {
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  sectionPadding: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stack: {
    gap: 24,
  },
  switchLabel: {
    flexShrink: 1,
    marginRight: 12,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
