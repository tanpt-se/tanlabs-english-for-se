import { StyleSheet, Text, View } from 'react-native';

import { getPosMeta, POS_BADGE_COLORS, type VocabularyPos } from '@/features/vocabulary/utils/pos';

type PosBadgeProps = {
  pos: VocabularyPos;
  size?: 'sm' | 'md';
};

/** Fixed widths so list rows stay aligned across `(n)` … `(phr v)`. */
const BADGE_WIDTH = {
  sm: 54,
  md: 62,
} as const;

/** Colored short POS badge, e.g. `(n)` for nouns. */
export function PosBadge({ pos, size = 'sm' }: PosBadgeProps) {
  const meta = getPosMeta(pos);
  const colors = POS_BADGE_COLORS[pos];
  const compact = size === 'sm';

  return (
    <View
      accessibilityLabel={meta.name}
      style={[
        styles.badge,
        compact ? styles.badgeSm : styles.badgeMd,
        {
          backgroundColor: colors.bg,
          minWidth: BADGE_WIDTH[size],
          width: BADGE_WIDTH[size],
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.label, compact ? styles.labelSm : styles.labelMd, { color: colors.text }]}
      >
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 6,
    flexShrink: 0,
    justifyContent: 'center',
  },
  badgeMd: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  badgeSm: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  labelMd: {
    fontSize: 12,
    lineHeight: 16,
  },
  labelSm: {
    fontSize: 11,
    lineHeight: 14,
  },
});
