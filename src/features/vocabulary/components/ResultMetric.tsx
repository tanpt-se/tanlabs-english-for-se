import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

export type ResultMetricType = 'correct' | 'needsPractice' | 'score';

type ResultMetricProps = {
  label?: string;
  type: ResultMetricType;
  value: string;
};

const DEFAULT_LABELS: Record<ResultMetricType, string> = {
  correct: 'Correct',
  needsPractice: 'Needs practice',
  score: 'Score',
};

/** Compact lesson outcome metric. Prefer three equal-width: Correct, Needs practice, Score. */
export function ResultMetric({ label, type, value }: ResultMetricProps) {
  const colors = useAppColors();
  const chrome =
    type === 'correct'
      ? { bg: colors.successSoft, bar: colors.success }
      : type === 'needsPractice'
      ? { bg: colors.warningSoft, bar: colors.warning }
      : { bg: colors.primarySoft, bar: colors.primary };

  return (
    <View style={[styles.card, { backgroundColor: chrome.bg }]}>
      <View style={[styles.bar, { backgroundColor: chrome.bar }]} />
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label ?? DEFAULT_LABELS[type]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: 2,
    height: 4,
    width: 28,
  },
  card: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.lg,
    elevation: 2,
    flex: 1,
    gap: themeTokens.spacing.sm,
    justifyContent: 'center',
    maxWidth: 108,
    minHeight: 96,
    padding: themeTokens.spacing['12'],
    shadowColor: '#0D1E46',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
});
