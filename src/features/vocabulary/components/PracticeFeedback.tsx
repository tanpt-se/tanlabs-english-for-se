import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type PracticeFeedbackProps = {
  correct: boolean;
  explanation: string;
  correctAnswerLabel: string;
};

/** Immediate-check card — Figma `15 · Immediate feedback` (title + explanation). */
export function PracticeFeedback({
  correct,
  explanation,
  correctAnswerLabel,
}: PracticeFeedbackProps) {
  const colors = useAppColors();
  const title = correct ? 'Correct' : 'Incorrect';
  const tone = correct ? colors.success : colors.danger;
  const soft = correct ? colors.successSoft : colors.dangerSoft;

  return (
    <View
      accessibilityLabel={`${title}. ${explanation}. Answer: ${correctAnswerLabel}`}
      accessibilityLiveRegion="polite"
      style={[styles.panel, { backgroundColor: soft }]}
      testID="vocabulary-practice-feedback"
    >
      <Text style={[styles.title, { color: tone }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{explanation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    borderRadius: themeTokens.radius.lg,
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing['20'],
  },
  title: {
    fontSize: themeTokens.typography.size.h3,
    fontWeight: '600',
    lineHeight: themeTokens.typography.lineHeight.h3,
  },
});
