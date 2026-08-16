import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type ContinueLearningCardProps = {
  lessonTitle: string;
  onPress: () => void;
  progressLabel: string;
  subtitle: string;
  testID?: string;
};

/** Resume card at the top of Home (Figma Continue Learning Card). */
export function ContinueLearningCard({
  lessonTitle,
  onPress,
  progressLabel,
  subtitle,
  testID = 'home-continue',
}: ContinueLearningCardProps) {
  const colors = useAppColors();

  return (
    <Pressable
      accessibilityLabel={`Continue learning, ${lessonTitle}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.success,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      testID={testID}
    >
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: colors.success }]}>CONTINUE LEARNING</Text>
        <Text style={[styles.title, { color: colors.text }]}>{lessonTitle}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.progress}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={[styles.progressLabel, { color: colors.text }]}>{progressLabel}</Text>
        </View>
        <View style={[styles.cta, { backgroundColor: colors.primaryHover }]}>
          <Text style={[styles.ctaLabel, { color: colors.onPrimary }]}>Continue</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderRadius: themeTokens.radius.sm,
    gap: themeTokens.spacing.md,
    padding: themeTokens.spacing.md,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1E46',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 9,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  copy: {
    gap: themeTokens.spacing.xs,
    width: '100%',
  },
  cta: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.xs,
    justifyContent: 'center',
    minWidth: 160,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: 4,
  },
  ctaLabel: {
    fontSize: themeTokens.typography.size.caption,
    fontWeight: '600',
    lineHeight: 16,
  },
  dot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    lineHeight: 14,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  progress: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: themeTokens.spacing.sm,
    marginRight: themeTokens.spacing.sm,
  },
  progressLabel: {
    fontSize: themeTokens.typography.size.bodySmall,
    fontWeight: '500',
    lineHeight: themeTokens.typography.lineHeight.bodySmall,
  },
  subtitle: {
    fontSize: themeTokens.typography.size.bodySmall,
    fontWeight: '400',
    lineHeight: themeTokens.typography.lineHeight.bodySmall,
  },
  title: {
    fontSize: themeTokens.typography.size.h3,
    fontWeight: '700',
    lineHeight: themeTokens.typography.lineHeight.h3,
  },
});
