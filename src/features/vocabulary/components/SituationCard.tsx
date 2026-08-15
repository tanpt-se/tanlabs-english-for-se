import { Pressable, StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type SituationCardProps = {
  description: string;
  onPress?: () => void;
  progress: string;
  /** Known ratio 0..1 for the situation progress bar. */
  progressRatio?: number;
  selected?: boolean;
  testID?: string;
  title: string;
};

function clampRatio(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

/** Situation list row — Figma Pattern/SituationCard. */
export function SituationCard({
  description,
  onPress,
  progress,
  progressRatio = 0,
  selected = false,
  testID,
  title,
}: SituationCardProps) {
  const colors = useAppColors();
  const ratio = clampRatio(progressRatio);
  const fillPercent = ratio > 0 ? Math.max(ratio * 100, 4) : 0;

  return (
    <Pressable
      accessibilityLabel={`${title}, ${progress}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={!onPress}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surfaceCard,
          borderColor: selected ? colors.primary : colors.borderSubtle,
          opacity: pressed && onPress ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Text style={[styles.progress, { color: colors.textSecondary }]}>{progress}</Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
        style={[styles.track, { backgroundColor: colors.borderSubtle }]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
              width: `${fillPercent}%`,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    gap: themeTokens.spacing.sm,
    overflow: 'hidden',
    padding: themeTokens.spacing.md,
  },
  copy: {
    flex: 1,
    gap: themeTokens.spacing['3'],
    paddingRight: themeTokens.spacing['12'],
  },
  description: {
    fontSize: themeTokens.typography.size.caption,
    lineHeight: themeTokens.typography.lineHeight.caption,
  },
  fill: {
    borderRadius: themeTokens.radius.pill,
    height: 6,
  },
  progress: {
    fontSize: themeTokens.typography.size.caption,
    fontWeight: '400',
    lineHeight: themeTokens.typography.lineHeight.caption,
  },
  title: {
    fontSize: themeTokens.typography.size.label,
    fontWeight: '500',
    lineHeight: themeTokens.typography.lineHeight.label,
  },
  top: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    borderRadius: themeTokens.radius.pill,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
});
