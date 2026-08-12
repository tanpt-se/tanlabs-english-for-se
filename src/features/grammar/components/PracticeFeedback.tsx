import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type PracticeFeedbackProps = {
  correct: boolean;
  explanation: string;
  correctAnswerLabel: string;
};

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
      accessibilityLiveRegion="polite"
      style={[styles.panel, { backgroundColor: soft }]}
      testID="grammar-practice-feedback"
    >
      <Text style={[styles.title, { color: tone }]}>
        {correct ? '✓' : '✕'} {title}
      </Text>
      <Text style={[styles.body, { color: colors.text }]}>Answer: {correctAnswerLabel}</Text>
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
    gap: themeTokens.spacing['6'],
    padding: themeTokens.spacing['18'],
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
