import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

import type { PropsWithChildren } from 'react';

type LessonSectionProps = PropsWithChildren<{
  title: string;
}>;

export function LessonSection({ title, children }: LessonSectionProps) {
  const colors = useAppColors();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: themeTokens.spacing.sm,
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
