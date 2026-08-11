import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type InsightPanelProps = {
  body: string;
  title: string;
  tone?: 'success' | 'danger' | 'neutral';
};

/** Immediate answer rationale panel (Figma PH3 “Clear and actionable”). */
export function InsightPanel({ body, title, tone = 'success' }: InsightPanelProps) {
  const colors = useAppColors();
  const chrome =
    tone === 'success'
      ? { bg: colors.successSoft, title: colors.success }
      : tone === 'danger'
      ? { bg: colors.dangerSoft, title: colors.danger }
      : { bg: colors.surfaceSecondary, title: colors.text };

  return (
    <View style={[styles.panel, { backgroundColor: chrome.bg }]}>
      <Text style={[styles.title, { color: chrome.title }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 19,
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
