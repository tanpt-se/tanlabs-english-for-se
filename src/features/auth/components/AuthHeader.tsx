import { StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/ui/brand';
import { AppText } from '@/components/ui/typography';
import { themeTokens, useAppColors } from '@/theme';

type AuthHeaderProps = {
  /** Show 80px brand mark (Figma Auth form hero). Default true for light auth forms. */
  showLogo?: boolean;
  subtitle?: string;
  title: string;
};

export function AuthHeader({ title, subtitle, showLogo = true }: AuthHeaderProps) {
  const colors = useAppColors();

  return (
    <View style={styles.hero}>
      {showLogo ? <BrandLogo size={80} style={styles.logo} /> : null}
      <View style={styles.copy}>
        <AppText accessibilityRole="header" align="center" variant="h1">
          {title}
        </AppText>
        {subtitle ? (
          <AppText align="center" color={colors.textSecondary} variant="bodyLarge">
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    alignItems: 'center',
    gap: themeTokens.spacing['12'],
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    gap: themeTokens.spacing['12'],
    width: '100%',
  },
  logo: {
    borderRadius: themeTokens.radius['2xl'],
  },
});
