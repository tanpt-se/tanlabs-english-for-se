import { config as defaultConfig } from '@gluestack-ui/config';

export const themeTokens = {
  colors: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    border: '#E5E5EA',
    text: '#111111',
    textMuted: '#6B6B6B',
    primary: '#007AFF',
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

export const gluestackConfig = defaultConfig;
