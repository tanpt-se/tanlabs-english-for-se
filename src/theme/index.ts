import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

import { brand, darkColors, lightColors } from '@/theme/palette';
import type { AppColors } from '@/theme/palette';

import type { Theme } from '@react-navigation/native';
import type { TextStyle } from 'react-native';

/** Figma V2 text styles (Text/*) — sizes + pixel line heights. */
export const textStyles = {
  display: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  bodyLarge: { fontSize: 17, fontWeight: '400', lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textStyles;

/** Design tokens mirrored from Figma V2 (`spacing/*`, `radius/*`, semantic colors, Text/*). */
export const themeTokens = {
  colors: {
    ...lightColors,
    brand,
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 12,
    card: 16,
    lg: 16,
    xl: 20,
    '2xl': 24,
    pill: 999,
  },
  spacing: {
    /** @deprecated Prefer `xs` (4). Kept for gradual migration. */
    '3': 4,
    xs: 4,
    /** Field label→input gap used in Figma Input (not in spacing collection). */
    '6': 6,
    sm: 8,
    '10': 10,
    '12': 12,
    md: 16,
    '14': 16,
    '18': 16,
    '20': 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '40': 40,
  },
  typography: {
    fontFamily: {
      sans: 'System',
    },
    /** Named Figma text style sizes. */
    size: {
      caption: 12,
      xs: 12,
      bodySmall: 13,
      label: 14,
      sm: 14,
      body: 15,
      md: 16,
      bodyLarge: 17,
      h3: 18,
      lg: 20,
      h2: 22,
      xl: 24,
      h1: 28,
      display: 32,
      hero: 32,
    },
    lineHeight: {
      caption: 16,
      bodySmall: 18,
      label: 20,
      body: 22,
      bodyLarge: 24,
      h3: 24,
      h2: 28,
      h1: 36,
      display: 40,
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
    textStyles,
  },
} as const;

export function useAppColors(): AppColors {
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
export type { AppColors } from '@/theme/palette';
