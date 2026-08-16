import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/brand';
import { themeTokens, useAppColors } from '@/theme';

export type HomeFeatureTone = 'progress' | 'available' | 'comingSoon';

type HomeFeatureRowProps = {
  accessibilityLabel?: string;
  icon: AppIconName;
  onPress?: () => void;
  /** 0..1 fill for the path progress bar. */
  progress?: number;
  statusLabel: string;
  /** @deprecated Figma V2 path rows no longer show a subtitle. Kept for callers. */
  subtitle?: string;
  testID?: string;
  title: string;
  tone?: HomeFeatureTone;
};

export function HomeFeatureRow({
  accessibilityLabel,
  icon,
  onPress,
  progress = 0,
  statusLabel,
  testID,
  title,
  tone = 'available',
}: HomeFeatureRowProps) {
  const colors = useAppColors();
  const disabled = !onPress;
  const ratio = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const fillWidth = ratio === 0 ? 0 : `${Math.max(ratio * 100, 4)}%`;

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
          borderColor: colors.borderSubtle,
          opacity: pressed && onPress ? 0.85 : 1,
        },
      ]}
      testID={testID}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.successSoft }]}>
        <AppIcon color={colors.success} name={icon} size={24} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              styles.statusLabel,
              { color: tone === 'comingSoon' ? colors.textMuted : colors.textSecondary },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.borderSubtle }]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: colors.success,
                width: fillWidth as `${number}%` | 0,
              },
            ]}
          />
        </View>
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
    minWidth: 0,
  },
  fill: {
    borderRadius: 3,
    height: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  row: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: themeTokens.spacing['12'],
    padding: themeTokens.spacing['12'],
    width: '100%',
  },
  statusLabel: {
    flexShrink: 0,
    fontSize: themeTokens.typography.size.caption,
    fontWeight: '500',
    lineHeight: themeTokens.typography.lineHeight.caption,
    marginLeft: themeTokens.spacing.sm,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    fontSize: themeTokens.typography.size.body,
    fontWeight: '600',
    lineHeight: themeTokens.typography.lineHeight.body,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  track: {
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
});
