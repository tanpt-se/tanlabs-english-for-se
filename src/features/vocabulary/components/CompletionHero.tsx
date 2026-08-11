import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type CompletionHeroProps = {
  message: string;
  situation: string;
  title: string;
};

/** Practice result hero (Figma PH3 Completion hero). */
export function CompletionHero({ message, situation, title }: CompletionHeroProps) {
  const colors = useAppColors();

  return (
    <View style={[styles.hero, { backgroundColor: colors.primarySoft }]}>
      <Text style={[styles.situation, { color: colors.textSecondary }]}>{situation}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: themeTokens.radius.xl,
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing['20'],
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
  },
  situation: {
    fontSize: 12,
    letterSpacing: 0.4,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
});
