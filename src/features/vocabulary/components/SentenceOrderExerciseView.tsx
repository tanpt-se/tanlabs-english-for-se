import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SentenceOrderExercise } from '@/features/vocabulary/types/content';
import { themeTokens, useAppColors } from '@/theme';

type SentenceOrderExerciseViewProps = {
  exercise: SentenceOrderExercise;
  orderedTokenIds: string[];
  checked: boolean;
  onChange: (tokenIds: string[]) => void;
};

export function SentenceOrderExerciseView({
  exercise,
  orderedTokenIds,
  checked,
  onChange,
}: SentenceOrderExerciseViewProps) {
  const colors = useAppColors();
  const remaining = exercise.payload.tokens.filter((token) => !orderedTokenIds.includes(token.id));
  const byId = new Map(exercise.payload.tokens.map((token) => [token.id, token]));

  return (
    <View style={styles.stack} testID="vocabulary-exercise-order">
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Tap tokens to build the sentence. Tap a selected token to remove it.
      </Text>
      <View
        accessibilityLabel="Current sentence order"
        style={[styles.slot, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        {orderedTokenIds.length === 0 ? (
          <Text style={[styles.placeholder, { color: colors.textMuted }]}>Empty</Text>
        ) : (
          orderedTokenIds.map((id) => {
            const token = byId.get(id);
            if (!token) {
              return null;
            }
            return (
              <Pressable
                key={`sel-${id}`}
                accessibilityLabel={`Remove ${token.text}`}
                accessibilityRole="button"
                disabled={checked}
                onPress={() => onChange(orderedTokenIds.filter((item) => item !== id))}
                style={[
                  styles.chip,
                  { backgroundColor: colors.primarySoft, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.chipText, { color: colors.text }]}>{token.text}</Text>
              </Pressable>
            );
          })
        )}
      </View>
      <View style={styles.pool}>
        {remaining.map((token) => (
          <Pressable
            key={`pool-${token.id}`}
            accessibilityLabel={`Add ${token.text}`}
            accessibilityRole="button"
            disabled={checked}
            onPress={() => onChange([...orderedTokenIds, token.id])}
            style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.chipText, { color: colors.text }]}>{token.text}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: themeTokens.spacing['12'],
    paddingVertical: themeTokens.spacing.sm,
  },
  chipText: {
    fontSize: 15,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  placeholder: {
    fontSize: 14,
    lineHeight: 20,
  },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeTokens.spacing.sm,
  },
  slot: {
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeTokens.spacing.sm,
    minHeight: 56,
    padding: themeTokens.spacing['12'],
  },
  stack: {
    gap: themeTokens.spacing.md,
  },
});
