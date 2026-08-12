import { StyleSheet, Text, View } from 'react-native';

import type { LessonExample } from '@/features/grammar/types/content';
import { themeTokens, useAppColors } from '@/theme';

type GrammarExampleProps = {
  example: LessonExample;
};

export function GrammarExample({ example }: GrammarExampleProps) {
  const colors = useAppColors();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
    >
      <Text style={[styles.context, { color: colors.primary }]}>{example.context}</Text>
      <Text style={[styles.sentence, { color: colors.text }]}>{example.sentence}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: themeTokens.radius.card,
    borderWidth: 1,
    gap: themeTokens.spacing.xs,
    padding: themeTokens.spacing.md,
  },
  context: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sentence: {
    fontSize: 15,
    lineHeight: 21,
  },
});
