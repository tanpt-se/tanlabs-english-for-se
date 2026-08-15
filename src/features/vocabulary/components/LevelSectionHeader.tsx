import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CEFR_LEVEL_LABELS, type CefrLevel } from '@/features/vocabulary/utils/levels';
import { themeTokens, useAppColors } from '@/theme';

type LevelSectionHeaderProps = {
  collapsed: boolean;
  count: number;
  level: string;
  onToggle: () => void;
};

function levelTone(
  level: string,
  colors: ReturnType<typeof useAppColors>,
): { soft: string; accent: string } {
  switch (level) {
    case 'A2':
      return { soft: colors.successSoft, accent: colors.success };
    case 'B1':
      return { soft: colors.primarySoft, accent: colors.primary };
    case 'B2':
      return { soft: colors.warningSoft, accent: colors.warning };
    case 'C1':
      return { soft: colors.surfaceSecondary, accent: colors.text };
    default:
      return { soft: colors.surfaceSecondary, accent: colors.textMuted };
  }
}

/**
 * Collapsible CEFR band header — Figma Pattern/LevelSectionHeader:
 * level + band chip + Cambridge CEFR meta + count chip (no icon / chevron).
 */
export function LevelSectionHeader({ collapsed, count, level, onToggle }: LevelSectionHeaderProps) {
  const colors = useAppColors();
  const tone = levelTone(level, colors);
  const band =
    level in CEFR_LEVEL_LABELS ? CEFR_LEVEL_LABELS[level as CefrLevel] : 'Cambridge CEFR';

  return (
    <Pressable
      accessibilityLabel={`${level}, ${band}, ${count} terms, ${
        collapsed ? 'collapsed' : 'expanded'
      }`}
      accessibilityRole="button"
      accessibilityState={{ expanded: !collapsed }}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      testID={`level-section-${level}`}
    >
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={[styles.levelCode, { color: colors.text }]}>{level}</Text>
          <View style={[styles.bandChip, { backgroundColor: tone.soft }]}>
            <Text style={[styles.bandChipText, { color: colors.textSecondary }]}>{band}</Text>
          </View>
        </View>
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          Cambridge CEFR · {count} term{count === 1 ? '' : 's'}
        </Text>
      </View>
      <View style={[styles.countChip, { backgroundColor: tone.soft }]}>
        <Text style={[styles.countText, { color: colors.text }]}>{count}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bandChip: {
    borderRadius: 999,
    paddingHorizontal: themeTokens.spacing.sm,
    paddingVertical: 2,
  },
  bandChipText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  countChip: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 36,
    paddingHorizontal: themeTokens.spacing.sm,
    paddingVertical: themeTokens.spacing.xs,
  },
  countText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  levelCode: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
  },
  row: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: themeTokens.spacing['12'],
    minHeight: 64,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing['12'],
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeTokens.spacing.sm,
  },
});
