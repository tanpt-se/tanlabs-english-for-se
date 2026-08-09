import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import { APP_ENV, isDevelopment } from '@/app/config/env';
import type { AppStackParamList } from '@/app/navigation/types';
import { AppButton } from '@/components/ui/AppControls';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useAuth } from '@/core/auth/AuthProvider';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useAppColors } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { profile: authProfile } = useAuth();
  const { data: profile } = useProfile();
  const flags = useFeatureFlags();
  const current = profile ?? authProfile;
  const colors = useAppColors();

  return (
    <ScreenScroll>
      <View style={styles.stack}>
        <Text accessibilityRole="header" style={[styles.heading, { color: colors.text }]}>
          Hi {current?.display_name ?? 'there'}
        </Text>
        <Text style={{ color: colors.text }}>English level: {current?.english_level ?? '—'}</Text>
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.text }]}>
            Grammar
          </Text>
          <Text style={{ color: colors.textMuted }}>
            {flags.data?.grammar
              ? 'Grammar is enabled.'
              : 'Coming soon — Grammar unlocks in a later phase.'}
          </Text>
        </View>
        <AppButton
          testID="home-settings"
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          variant="outline"
          onPress={() => navigation.navigate('Settings')}
          label="Settings"
        />
        {isDevelopment ? (
          <Text style={{ color: colors.textMuted }}>
            env={APP_ENV} · flags loaded={String(Boolean(flags.data))}
          </Text>
        ) : null}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  stack: {
    gap: 16,
  },
});
