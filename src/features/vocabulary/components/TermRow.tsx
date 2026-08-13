import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PosBadge } from '@/features/vocabulary/components/PosBadge';
import type { VocabularyPos } from '@/features/vocabulary/utils/pos';
import { themeTokens, useAppColors } from '@/theme';

type TermRowProps = {
  known: boolean;
  level?: string;
  onPressRow?: () => void;
  onToggleKnown: () => void;
  pos: VocabularyPos;
  term: string;
};

/**
 * Compact vocabulary list row: POS badge + term + known toggle.
 * Tap opens term detail (not inline expand).
 */
export function TermRow({ known, level, onPressRow, onToggleKnown, pos, term }: TermRowProps) {
  const colors = useAppColors();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: known ? colors.successSoft : colors.surface,
          borderColor: known ? colors.success : colors.borderSubtle,
        },
      ]}
    >
      <Pressable
        accessibilityLabel={`${term}, ${pos}${level ? `, ${level}` : ''}${
          known ? '. Known' : '. Learning'
        }`}
        accessibilityRole="button"
        onPress={onPressRow}
        style={styles.main}
      >
        <View style={styles.termLine}>
          <PosBadge pos={pos} />
          <Text numberOfLines={2} style={[styles.term, { color: colors.text }]}>
            {term}
          </Text>
        </View>
        {level ? (
          <Text style={[styles.levelHint, { color: colors.textMuted }]}>{level}</Text>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityLabel={known ? `Mark ${term} as learning` : `Mark ${term} as known`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onToggleKnown}
        style={[
          styles.knownBtn,
          {
            backgroundColor: known ? colors.success : colors.surfaceSecondary,
            borderColor: known ? colors.success : colors.border,
          },
        ]}
        testID={`known-toggle-${term}`}
      >
        <Text style={[styles.knownLabel, { color: known ? colors.onSuccess : colors.textMuted }]}>
          {known ? 'Known' : 'Learn'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  knownBtn: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.xs,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  knownLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
  },
  levelHint: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingRight: 10,
  },
  row: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: themeTokens.spacing['12'],
    paddingVertical: themeTokens.spacing['10'],
  },
  term: {
    flex: 1,
    fontSize: themeTokens.typography.size.label,
    fontWeight: '600',
    lineHeight: themeTokens.typography.lineHeight.label,
    minWidth: 0,
  },
  termLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: themeTokens.spacing.sm,
  },
});
