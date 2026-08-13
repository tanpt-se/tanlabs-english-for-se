import { useColorScheme, StyleSheet, Text, View } from 'react-native';

import { brand, themeTokens, useAppColors } from '@/theme';

type ProgressBannerProps = {
  progress?: number;
  subtitle: string;
  title: string;
  /** `navy` = Grammar overview; `soft` = Vocabulary peach banner (Figma accent/muted). */
  tone?: 'navy' | 'soft';
};

export function ProgressBanner({ progress, subtitle, title, tone = 'navy' }: ProgressBannerProps) {
  const isDark = useColorScheme() === 'dark';
  const colors = useAppColors();
  const ratio =
    typeof progress === 'number' && Number.isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : null;
  const soft = tone === 'soft';

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: soft ? colors.primarySoft : isDark ? brand.navy800 : brand.navy900,
          borderRadius: soft ? themeTokens.radius.lg : themeTokens.radius.xl,
        },
      ]}
    >
      <Text style={[styles.title, { color: soft ? colors.text : brand.chalk }]}>{title}</Text>
      <Text
        style={[
          styles.subtitle,
          soft ? styles.subtitleSoft : styles.subtitleNavy,
          { color: soft ? colors.textSecondary : brand.coral300 },
        ]}
      >
        {subtitle}
      </Text>
      {ratio === null ? null : (
        <View
          style={[styles.track, { backgroundColor: soft ? colors.borderSubtle : brand.navy700 }]}
        >
          <View
            style={[
              styles.fill,
              {
                backgroundColor: soft ? colors.primary : brand.coral400,
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
    gap: themeTokens.spacing['10'],
    padding: themeTokens.spacing['20'],
    width: '100%',
  },
  fill: {
    borderRadius: 3,
    height: 7,
  },
  subtitle: {
    fontSize: themeTokens.typography.size.label,
    lineHeight: themeTokens.typography.lineHeight.label,
  },
  subtitleNavy: {
    fontWeight: '500',
  },
  subtitleSoft: {
    fontWeight: '400',
  },
  title: {
    fontSize: themeTokens.typography.size.h3,
    fontWeight: '600',
    lineHeight: themeTokens.typography.lineHeight.h3,
  },
  track: {
    borderRadius: 3,
    height: 7,
    overflow: 'hidden',
    width: '100%',
  },
});
