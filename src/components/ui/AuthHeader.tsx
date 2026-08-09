import { StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/theme';

type AuthHeaderProps = {
  subtitle?: string;
  title: string;
};

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  const colors = useAppColors();

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
});
