import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

import type { PressableProps } from 'react-native';

export type AppButtonSize = 'small' | 'medium' | 'large';
export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  /** @deprecated Use `primary`. */
  | 'solid'
  /** @deprecated Use `ghost`. */
  | 'outline';

type AppButtonProps = Omit<PressableProps, 'children'> & {
  fullWidth?: boolean;
  label: string;
  loading?: boolean;
  /** Figma Size: Small | Normal(medium) | Large. Default medium (44px). */
  size?: AppButtonSize;
  /**
   * @deprecated Prefer `variant="destructive"`.
   * When set with primary/solid, uses danger colors.
   */
  tone?: 'default' | 'danger';
  /** Figma Style: Primary | Secondary | Ghost | Destructive. */
  variant?: AppButtonVariant;
};

function resolveVariant(
  variant: AppButtonVariant,
  tone: 'default' | 'danger',
): 'primary' | 'secondary' | 'ghost' | 'destructive' {
  if (variant === 'solid') {
    return tone === 'danger' ? 'destructive' : 'primary';
  }
  if (variant === 'outline') {
    return 'ghost';
  }
  if (tone === 'danger' && variant === 'primary') {
    return 'destructive';
  }
  return variant;
}

/**
 * Figma `Button/AppButton` — Size × Style × State(Loading).
 * Default size Medium (44px height). Prefer Medium; use Large only when a screen calls for it.
 */
export function AppButton({
  disabled,
  fullWidth = false,
  label,
  loading = false,
  size = 'medium',
  style,
  tone = 'default',
  variant = 'primary',
  ...props
}: AppButtonProps) {
  const colors = useAppColors();
  const resolved = resolveVariant(variant, tone);
  const isDisabled = Boolean(disabled || loading);
  const { accessibilityLabel: accessibilityLabelProp, ...pressableProps } = props;
  const resolvedAccessibilityLabel = loading
    ? `${accessibilityLabelProp ?? label}, loading`
    : accessibilityLabelProp ?? label;

  const sizeStyle =
    size === 'large'
      ? styles.buttonLarge
      : size === 'small'
      ? styles.buttonSmall
      : styles.buttonMedium;

  const fontSize =
    size === 'large'
      ? themeTokens.typography.size.body
      : size === 'small'
      ? themeTokens.typography.size.caption
      : themeTokens.typography.size.body;
  const lineHeight = size === 'small' ? themeTokens.typography.lineHeight.caption : 20;
  const fontWeight = size === 'large' ? ('600' as const) : ('500' as const);

  const isFilled = resolved === 'primary' || resolved === 'destructive';
  const accent = resolved === 'destructive' ? colors.danger : colors.primary;
  const onAccent = resolved === 'destructive' ? colors.onDanger : colors.onPrimary;
  const labelColor = isFilled
    ? onAccent
    : resolved === 'secondary'
    ? isDisabled && !loading
      ? colors.textMuted
      : colors.text
    : isDisabled && !loading
    ? colors.textMuted
    : colors.primary;
  const spinnerColor = isFilled ? onAccent : colors.primary;

  return (
    <Pressable
      {...pressableProps}
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      style={(state) => {
        const pressed = state.pressed;
        let backgroundColor = 'transparent';
        let borderColor = 'transparent';
        let opacity = 1;

        if (isFilled) {
          backgroundColor =
            isDisabled && !loading
              ? colors.surfaceSecondary
              : pressed
              ? colors.primaryPressed
              : accent;
          borderColor = backgroundColor;
        } else if (resolved === 'secondary') {
          backgroundColor = pressed ? colors.primarySoft : colors.surface;
          borderColor = isDisabled && !loading ? colors.borderSubtle : colors.border;
          if (isDisabled && !loading) {
            opacity = 0.5;
          }
        } else {
          borderColor = 'transparent';
          if (pressed && !isDisabled) {
            opacity = 0.75;
          } else if (isDisabled && !loading) {
            opacity = 0.5;
          }
        }

        return [
          styles.button,
          sizeStyle,
          fullWidth ? styles.buttonFullWidth : null,
          { backgroundColor, borderColor, opacity },
          typeof style === 'function' ? style(state) : style,
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={{ color: labelColor, fontSize, fontWeight, lineHeight }}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 160,
  },
  buttonFullWidth: {
    alignSelf: 'stretch',
    minWidth: 0,
    width: '100%',
  },
  buttonLarge: {
    minHeight: 52,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing.md,
  },
  buttonMedium: {
    minHeight: 44,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing['12'],
  },
  buttonSmall: {
    minHeight: 36,
    minWidth: 120,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
  },
});
