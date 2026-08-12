import { useColorScheme, StyleSheet, Text, View } from 'react-native';

import { brand, themeTokens } from '@/theme';

type ProgressBannerProps = {
  progress?: number;
  subtitle: string;
  title: string;
};

export function ProgressBanner({ progress, subtitle, title }: ProgressBannerProps) {
  const isDark = useColorScheme() === 'dark';
  const ratio =
    typeof progress === 'number' && Number.isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : null;

  return (
    <View style={[styles.banner, { backgroundColor: isDark ? brand.navy800 : brand.navy900 }]}>
      <Text style={[styles.title, { color: brand.chalk }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: brand.coral300 }]}>{subtitle}</Text>
      {ratio === null ? null : (
        <View style={[styles.track, { backgroundColor: brand.navy700 }]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: brand.coral400,
                width: `${Math.max(ratio * 100, ratio > 0 ? 4 : 0)}%`,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: themeTokens.radius.xl,
    gap: themeTokens.spacing['10'],
    padding: themeTokens.spacing['20'],
    width: '100%',
  },
  fill: {
    borderRadius: 3,
    height: 7,
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
  track: {
    borderRadius: 3,
    height: 7,
    overflow: 'hidden',
    width: '100%',
  },
});
