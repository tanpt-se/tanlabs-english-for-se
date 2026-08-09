import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

import { brand, darkColors, lightColors } from '@/theme/palette';

import type { Theme } from '@react-navigation/native';

export const themeTokens = {
  colors: {
    ...lightColors,
    brand,
  },
  radius: {
    md: 12,
    lg: 16,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    fontFamily: {
      sans: 'System',
    },
    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
      hero: 32,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
} as const;

export function useAppColors() {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

export const navigationLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightColors.primary,
    background: lightColors.background,
    card: lightColors.surface,
    text: lightColors.text,
    border: lightColors.border,
    notification: lightColors.primary,
  },
};

export const navigationDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkColors.primary,
    background: darkColors.background,
    card: darkColors.surface,
    text: darkColors.text,
    border: darkColors.border,
    notification: darkColors.primary,
  },
};

export { brand, darkColors, lightColors } from '@/theme/palette';
