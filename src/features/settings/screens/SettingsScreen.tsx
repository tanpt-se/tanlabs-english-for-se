import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { learningDisabledDestinations } from '@/app/navigation/learningDisabledDestinations';
import type { AppStackParamList } from '@/app/navigation/types';
import { useMainTabSelect } from '@/app/navigation/useMainTabSelect';
import { AppButton } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/feedback';
import { ScreenScroll } from '@/components/ui/layout';
import { BottomNavigation } from '@/components/ui/navigation';
import { TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { ProfileSummaryCard } from '@/features/profile/components';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { SettingRow } from '@/features/settings/components';
import { useNotificationSettings } from '@/features/settings/hooks/useNotificationSettings';
import { themeTokens, useAppColors } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const LEVEL_LABELS: Record<string, string> = {
  A1: 'A1 · Beginner',
  A2: 'A2 · Elementary',
  B1: 'B1 · Intermediate',
  B2: 'B2 · Upper intermediate',
  C1: 'C1 · Advanced',
};

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const onSelectTab = useMainTabSelect();
  const { signOut, user } = useAuth();
  const { data: profile, isError, refetch, isFetching } = useProfile();
  const { preferenceEnabled, setEnabled, isUpdating } = useNotificationSettings();
  const [busy, setBusy] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const colors = useAppColors();
  const flags = useFeatureFlags();
  const disabledDestinations = learningDisabledDestinations(flags.data);

  const displayName = profile?.display_name ?? 'Learner';
  const levelKey = profile?.english_level ?? '—';
  const levelLabel = LEVEL_LABELS[levelKey] ?? levelKey;

  const onConfirmSignOut = async () => {
    setBusy(true);
    try {
      await trackEvent('logout');
      await signOut();
    } finally {
      setBusy(false);
      setSignOutVisible(false);
    }
  };

  return (
    <ScreenScroll
      footer={
        <BottomNavigation
          active="profile"
          disabledDestinations={disabledDestinations}
          onSelect={onSelectTab}
        />
      }
    >
      <View style={styles.stack}>
        <TopAppHeader title="Profile & settings" />

        <ProfileSummaryCard
          displayName={displayName}
          email={user?.email}
          levelLabel={levelLabel}
          onEditPress={() => navigation.navigate('EditProfile')}
        />

        {isError ? (
          <View style={styles.errorBlock}>
            <Text style={{ color: colors.danger }}>Could not load profile.</Text>
            <AppButton
              accessibilityLabel="Retry loading profile"
              accessibilityRole="button"
              fullWidth
              variant="outline"
              onPress={() => refetch()}
              disabled={isFetching}
              label={isFetching ? 'Retrying…' : 'Retry'}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Notifications</Text>
          <SettingRow
            label="Enable notifications"
            switchValue={preferenceEnabled}
            value="Synced with your account"
            onValueChange={(value) => setEnabled(value)}
            disabled={isUpdating}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>App preferences</Text>
          <SettingRow label="Appearance" value="System" />
          <SettingRow label="Language" value="English" />
        </View>

        <AppButton
          testID="settings-sign-out"
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          disabled={busy}
          fullWidth
          onPress={() => setSignOutVisible(true)}
          label="Sign out"
        />
      </View>

      <ConfirmModal
        busy={busy}
        confirmLabel="Sign out"
        confirmTone="danger"
        message="You’ll need to sign in again to sync progress and continue learning."
        note="You can sign back in anytime on this device."
        title="Sign out?"
        visible={signOutVisible}
        onCancel={() => {
          if (!busy) {
            setSignOutVisible(false);
          }
        }}
        onConfirm={onConfirmSignOut}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  errorBlock: {
    gap: themeTokens.spacing.sm,
  },
  section: {
    gap: themeTokens.spacing.xs,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  stack: {
    gap: themeTokens.spacing.md,
    width: '100%',
  },
});
