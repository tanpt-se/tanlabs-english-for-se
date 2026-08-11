import { StyleSheet, Text, View } from 'react-native';

import { BrandLogo } from '@/components/ui/brand';
import { themeTokens, useAppColors } from '@/theme';

type AuthHeaderProps = {
  /** Show brand mark above the title (Welcome only in current design). */
  showLogo?: boolean;
  subtitle?: string;
  title: string;
};

export function AuthHeader({ title, subtitle, showLogo = false }: AuthHeaderProps) {
  const colors = useAppColors();

  return (
    <View style={styles.container}>
      {showLogo ? <BrandLogo style={styles.logo} /> : null}
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
    gap: themeTokens.spacing.sm,
    marginBottom: themeTokens.spacing.lg,
  },
  logo: {
    marginBottom: themeTokens.spacing.sm,
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
