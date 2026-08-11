import { useColorScheme, StyleSheet, Text, View } from 'react-native';

import { brand, themeTokens } from '@/theme';

type ProgressBannerProps = {
  subtitle: string;
  title: string;
};

/** Navy progress banner on Vocabulary home (Figma PH3). */
export function ProgressBanner({ subtitle, title }: ProgressBannerProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={[styles.banner, { backgroundColor: isDark ? brand.navy800 : brand.navy900 }]}>
      <Text style={[styles.title, { color: brand.chalk }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: brand.coral300 }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: themeTokens.radius.xl,
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing['20'],
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
  },
});
