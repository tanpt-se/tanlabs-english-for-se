import { StyleSheet, Text, View } from 'react-native';

import { getPosMeta, POS_BADGE_COLORS, type VocabularyPos } from '@/features/vocabulary/utils/pos';
import { themeTokens, useAppColors } from '@/theme';

type PosBadgeProps = {
  pos: VocabularyPos;
  size?: 'sm' | 'md';
  /** `muted` = Figma TermRow peach chip; `color` = Cambridge dictionary chip. */
  tone?: 'color' | 'muted';
};

const BADGE_WIDTH = {
  sm: 54,
  md: 62,
} as const;

/** POS chip: muted list code (`n`) or colored dictionary label (`(n)`). */
export function PosBadge({ pos, size = 'sm', tone = 'color' }: PosBadgeProps) {
  const meta = getPosMeta(pos);
  const appColors = useAppColors();

  if (tone === 'muted') {
    return (
      <View
        accessibilityLabel={meta.name}
        style={[styles.muted, { backgroundColor: appColors.surfaceSecondary }]}
      >
        <Text style={[styles.mutedLabel, { color: appColors.textMuted }]}>{meta.code}</Text>
      </View>
    );
  }

  const colors = POS_BADGE_COLORS[pos];
  const compact = size === 'sm';

  return (
    <View
      accessibilityLabel={meta.name}
      style={[
        styles.color,
        compact ? styles.colorSm : styles.colorMd,
        {
          backgroundColor: colors.bg,
          minWidth: BADGE_WIDTH[size],
          width: BADGE_WIDTH[size],
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.colorLabel,
          compact ? styles.colorLabelSm : styles.colorLabelMd,
          { color: colors.text },
        ]}
      >
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  color: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 6,
    flexShrink: 0,
    justifyContent: 'center',
  },
  colorLabel: {
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  colorLabelMd: {
    fontSize: 12,
    lineHeight: 16,
  },
  colorLabelSm: {
    fontSize: 11,
    lineHeight: 14,
  },
  colorMd: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  colorSm: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  muted: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: themeTokens.radius.xs,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: themeTokens.spacing.sm,
    paddingVertical: 2,
  },
  mutedLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});
