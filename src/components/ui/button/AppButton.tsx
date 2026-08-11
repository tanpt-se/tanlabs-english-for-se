import { Pressable, StyleSheet, Text } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

import type { PressableProps } from 'react-native';

type AppButtonProps = Omit<PressableProps, 'children'> & {
  fullWidth?: boolean;
  label: string;
  /** Defaults to `medium` (Figma Button/AppButton Size=Medium). */
  size?: 'medium' | 'large';
  tone?: 'default' | 'danger';
  variant?: 'solid' | 'outline' | 'secondary';
};

export function AppButton({
  disabled,
  fullWidth = false,
  label,
  size = 'medium',
  style,
  tone = 'default',
  variant = 'solid',
  ...props
}: AppButtonProps) {
  const colors = useAppColors();
  const accent = tone === 'danger' ? colors.danger : colors.primary;
  const onAccent = tone === 'danger' ? colors.onDanger : colors.onPrimary;
  const isLarge = size === 'large';
  const isSecondary = variant === 'secondary';
  const isSolid = variant === 'solid';
  const labelColor = isSolid ? onAccent : isSecondary ? colors.text : accent;
  const labelStyle = {
    color: disabled && !isSolid ? colors.textMuted : labelColor,
    fontSize: isLarge ? themeTokens.typography.size.md : themeTokens.typography.size.sm,
    fontWeight: isLarge ? ('600' as const) : ('500' as const),
    lineHeight: isLarge ? 22 : 20,
  };

  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={(state) => [
        styles.button,
        isLarge ? styles.buttonLarge : styles.buttonMedium,
        fullWidth ? styles.buttonFullWidth : null,
        {
          backgroundColor: isSolid
            ? disabled
              ? colors.surfaceSecondary
              : state.pressed
              ? colors.primaryPressed
              : accent
            : isSecondary
            ? state.pressed
              ? colors.primarySoft
              : colors.surface
            : 'transparent',
          borderColor: isSolid
            ? disabled
              ? colors.surfaceSecondary
              : state.pressed
              ? colors.primaryPressed
              : accent
            : isSecondary
            ? disabled
              ? colors.borderSubtle
              : colors.border
            : accent,
          opacity: disabled
            ? isSolid
              ? 1
              : 0.5
            : !isSolid && !isSecondary && state.pressed
            ? 0.75
            : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Text style={[styles.buttonLabel, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 160,
  },
  buttonFullWidth: {
    alignSelf: 'stretch',
    minWidth: 0,
    width: '100%',
  },
  buttonLabel: {},
  buttonLarge: {
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing.md,
  },
  buttonMedium: {
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing['12'],
  },
});
