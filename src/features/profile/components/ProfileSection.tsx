import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

import type { PropsWithChildren } from 'react';

type ProfileSectionProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function ProfileSection({ title, description, children }: ProfileSectionProps) {
  const colors = useAppColors();

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      ) : null}
      <View
        style={[styles.surface, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  surface: {
    borderRadius: themeTokens.radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});
