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
 * Compact vocabulary list row — Figma Vocabulary/TermRow:
 * POS badge + term + Learn/Known status (tap row for dictionary).
 */
export function TermRow({ known, level, onPressRow, onToggleKnown, pos, term }: TermRowProps) {
  const colors = useAppColors();

  const termLabel = `${term}, ${pos}${level ? `, ${level}` : ''}${
    known ? '. Known' : '. Learning'
  }`;
  const termBody = (
    <View style={styles.termLine}>
      <PosBadge pos={pos} tone="muted" />
      <Text numberOfLines={2} style={[styles.term, { color: colors.text }]}>
        {term}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      {onPressRow ? (
        <Pressable
          accessibilityLabel={termLabel}
          accessibilityRole="button"
          onPress={onPressRow}
          style={styles.main}
        >
          {termBody}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={termLabel} style={styles.main}>
          {termBody}
        </View>
      )}
      <Pressable
        accessibilityLabel={known ? `Mark ${term} as learning` : `Mark ${term} as known`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onToggleKnown}
        style={[
          styles.status,
          {
            backgroundColor: known ? colors.successSoft : colors.surfaceSecondary,
          },
        ]}
        testID={`known-toggle-${term}`}
      >
        <Text style={[styles.statusLabel, { color: known ? colors.success : colors.primary }]}>
          {known ? 'Known' : 'Learn'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingRight: themeTokens.spacing.sm,
  },
  row: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing['12'],
  },
  status: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.xs,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: themeTokens.spacing['12'],
    paddingVertical: themeTokens.spacing.xs,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
  term: {
    flex: 1,
    fontSize: themeTokens.typography.size.md,
    fontWeight: '500',
    lineHeight: 22,
    minWidth: 0,
  },
  termLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: themeTokens.spacing.sm,
  },
});
