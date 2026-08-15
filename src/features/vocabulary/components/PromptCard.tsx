import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type PromptCardProps = {
  testID?: string;
  text: string;
};

/** Scenario context card — Figma choose-expression ContextCard. */
export function PromptCard({ testID, text }: PromptCardProps) {
  const colors = useAppColors();

  return (
    <View testID={testID} style={[styles.card, { backgroundColor: colors.surfaceCard }]}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: themeTokens.radius.xl,
    padding: themeTokens.spacing['20'],
    width: '100%',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});
