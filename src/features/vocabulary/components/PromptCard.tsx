import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type PromptCardProps = {
  text: string;
};

/** Scenario prompt card above answer options (Figma PH3 choose-expression). */
export function PromptCard({ text }: PromptCardProps) {
  const colors = useAppColors();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
    >
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: themeTokens.spacing['20'],
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
});
