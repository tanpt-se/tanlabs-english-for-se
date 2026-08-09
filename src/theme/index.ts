import { config as defaultConfig } from '@gluestack-ui/config';

/** WCAG AA-friendly muted body on light backgrounds (≥4.5:1 on #F2F2F7 / white). */
const contrastColors = {
  backgroundLight100: '#F2F2F7',
  textLight400: '#6B6B6B',
  textLight500: '#3C3C43',
  textLight600: '#2C2C2E',
  primary500: '#0A66D1',
  primary600: '#005DB4',
} as const;

export const themeTokens = {
  colors: {
    background: contrastColors.backgroundLight100,
    surface: '#FFFFFF',
    border: '#E5E5EA',
    text: '#111111',
    textMuted: contrastColors.textLight500,
    primary: contrastColors.primary500,
    danger: '#FF3B30',
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

/** Override gluestack size `h` so Dynamic Type can grow past the default 40pt md height. */
export const accessibleButtonProps = {
  h: 'auto' as const,
  minHeight: 44,
  py: '$3' as const,
};

function withContrastColors(config: typeof defaultConfig) {
  const tokens = config?.tokens;
  const colors = tokens?.colors;
  if (!tokens || !colors) {
    return config;
  }

  return {
    ...config,
    tokens: {
      ...tokens,
      colors: {
        ...colors,
        ...contrastColors,
      },
    },
  };
}

export const gluestackConfig = withContrastColors(defaultConfig);
