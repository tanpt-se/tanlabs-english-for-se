import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

export type FeedbackType = 'success' | 'error' | 'info';

type FeedbackProps = {
  message: string;
  title: string;
  type?: FeedbackType;
};

export function Feedback({ message, title, type = 'success' }: FeedbackProps) {
  const colors = useAppColors();
  const chrome =
    type === 'success'
      ? { bg: colors.successSoft, border: colors.success, glyph: '✓', glyphBg: colors.success }
      : type === 'error'
      ? { bg: colors.dangerSoft, border: colors.danger, glyph: '!', glyphBg: colors.danger }
      : {
          bg: colors.primarySoft,
          border: colors.primary,
          glyph: 'i',
          glyphBg: colors.primary,
        };

  return (
    <View style={[styles.row, { backgroundColor: chrome.bg, borderColor: chrome.border }]}>
      <View style={[styles.icon, { backgroundColor: chrome.glyphBg }]}>
        <Text style={[styles.glyph, { color: colors.textInverse }]}>{chrome.glyph}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: 4,
  },
  glyph: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  icon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginTop: 2,
    width: 24,
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
  },
  row: {
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: themeTokens.spacing['12'],
    minHeight: 84,
    paddingHorizontal: 11,
    paddingVertical: 13,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
});
