import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/brand';
import { themeTokens, useAppColors } from '@/theme';

export type HomeFeatureTone = 'progress' | 'available' | 'comingSoon';

type HomeFeatureRowProps = {
  accessibilityLabel?: string;
  icon: AppIconName;
  onPress?: () => void;
  statusLabel: string;
  subtitle: string;
  testID?: string;
  title: string;
  tone?: HomeFeatureTone;
};

export function HomeFeatureRow({
  accessibilityLabel,
  icon,
  onPress,
  statusLabel,
  subtitle,
  testID,
  title,
  tone = 'available',
}: HomeFeatureRowProps) {
  const colors = useAppColors();
  const soft =
    tone === 'progress'
      ? colors.successSoft
      : tone === 'comingSoon'
      ? colors.surfaceSecondary
      : colors.primarySoft;
  const disabled = !onPress;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed && onPress ? 0.85 : 1,
        },
      ]}
      testID={testID}
    >
      <View style={[styles.iconWrap, { backgroundColor: soft }]}>
        <AppIcon color={colors.text} name={icon} size={24} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <View style={[styles.status, { backgroundColor: soft }]}>
        <Text numberOfLines={2} style={[styles.statusLabel, { color: colors.text }]}>
          {statusLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    flexShrink: 1,
    gap: themeTokens.spacing.xs,
    justifyContent: 'center',
    minHeight: 44,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  row: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: themeTokens.spacing['12'],
    minHeight: 78,
    paddingHorizontal: themeTokens.spacing['14'],
    paddingVertical: themeTokens.spacing['12'],
    width: '100%',
  },
  status: {
    alignItems: 'center',
    borderRadius: 999,
    flexShrink: 0,
    justifyContent: 'center',
    maxWidth: 104,
    paddingHorizontal: themeTokens.spacing.sm,
    paddingVertical: themeTokens.spacing.xs,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
