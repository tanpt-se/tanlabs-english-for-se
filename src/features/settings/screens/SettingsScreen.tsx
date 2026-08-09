import { Box, Button, ButtonText, Switch, Text, VStack } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Linking } from 'react-native';

import type { AppStackParamList } from '@/app/navigation/types';
import { ProfileSection } from '@/components/ui/ProfileSection';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SettingRow } from '@/components/ui/SettingRow';
import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import { triggerTestCrash } from '@/core/monitoring/crashlytics';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useNotificationSettings } from '@/features/settings/hooks/useNotificationSettings';
import { accessibleButtonProps } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { signOut } = useAuth();
  const { data: profile, isError, refetch, isFetching } = useProfile();
  const { preferenceEnabled, osGranted, setEnabled, isUpdating } = useNotificationSettings();
  const [busy, setBusy] = useState(false);

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
      <VStack space="lg">
        <ProfileSection title="Profile">
          <SettingRow label="Display name" value={profile?.display_name ?? '—'} />
          <SettingRow label="English level" value={profile?.english_level ?? '—'} />
          {isError ? (
            <Box px="$4" py="$2">
              <Text color="$error700">Could not load profile.</Text>
              <Button
                accessibilityLabel="Retry loading profile"
                accessibilityRole="button"
                size="md"
                variant="outline"
                mt="$2"
                {...accessibleButtonProps}
                onPress={() => refetch()}
                isDisabled={isFetching}
              >
                <ButtonText>{isFetching ? 'Retrying…' : 'Retry'}</ButtonText>
              </Button>
            </Box>
          ) : null}
          <Box px="$4" pb="$3">
            <Button
              accessibilityLabel="Edit profile"
              accessibilityRole="button"
              size="md"
              variant="outline"
              {...accessibleButtonProps}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <ButtonText>Edit profile</ButtonText>
            </Button>
          </Box>
        </ProfileSection>

        <ProfileSection
          title="Notifications"
          description="Preference syncs to Supabase when signed in."
        >
          <Box
            px="$4"
            py="$3"
            minHeight={44}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text color="$textLight900" flexShrink={1} mr="$3">
              Enable notifications
            </Text>
            <Switch
              accessibilityLabel="Enable notifications"
              accessibilityRole="switch"
              value={preferenceEnabled}
              onValueChange={(value: boolean) => setEnabled(value)}
              isDisabled={isUpdating}
            />
          </Box>
          {preferenceEnabled && !osGranted ? (
            <Box px="$4" pb="$3">
              <Text color="$textLight600" fontSize="$sm" mb="$2">
                Notifications are blocked in system settings. Enable them there to receive alerts,
                or turn the preference off above.
              </Text>
              <Button
                accessibilityLabel="Open system notification settings"
                accessibilityRole="button"
                size="md"
                variant="outline"
                {...accessibleButtonProps}
                onPress={() => {
                  Linking.openSettings().catch(() => undefined);
                }}
              >
                <ButtonText>Open system settings</ButtonText>
              </Button>
            </Box>
          ) : null}
        </ProfileSection>

        {__DEV__ ? (
          <ProfileSection title="Developer" description="PH1 Firebase Console verification only.">
            <Box px="$4" pb="$3">
              <Button
                accessibilityLabel="Trigger test crash for Crashlytics"
                accessibilityRole="button"
                size="md"
                variant="outline"
                action="negative"
                {...accessibleButtonProps}
                onPress={() => triggerTestCrash()}
              >
                <ButtonText>Trigger test crash</ButtonText>
              </Button>
            </Box>
          </ProfileSection>
        ) : null}

        <Button
          testID="settings-sign-out"
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          action="negative"
          {...accessibleButtonProps}
          onPress={onSignOut}
          isDisabled={busy}
        >
          <ButtonText>{busy ? 'Signing out…' : 'Sign out'}</ButtonText>
        </Button>
      </VStack>
    </ScreenScroll>
  );
}
