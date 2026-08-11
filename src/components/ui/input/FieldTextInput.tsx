import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/brand';
import { themeTokens, useAppColors } from '@/theme';

import type { TextInputProps } from 'react-native';

type FieldTextInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  error?: boolean;
  helper?: string;
  label: string;
  mode?: 'text' | 'password';
};

/**
 * Labeled text field. Modes: text / password; states via focus, error, disabled.
 * Password visibility uses a 44×44 trailing Eye / EyeOff action.
 */
export function FieldTextInput({
  accessibilityLabel,
  editable = true,
  error = false,
  helper,
  label,
  mode = 'text',
  onBlur,
  onFocus,
  style,
  ...props
}: FieldTextInputProps) {
  const colors = useAppColors();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const disabled = editable === false;
  const isPassword = mode === 'password';

  const borderColor = error
    ? colors.danger
    : focused
    ? colors.primary
    : disabled
    ? colors.borderSubtle
    : colors.border;

  return (
    <View style={styles.stack}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View
        style={[
          styles.field,
          disabled ? styles.fieldDisabled : null,
          {
            backgroundColor: disabled ? colors.surfaceSecondary : colors.surface,
            borderColor,
          },
        ]}
      >
        <TextInput
          {...props}
          accessibilityLabel={accessibilityLabel ?? label}
          editable={editable}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={props.placeholderTextColor ?? colors.textMuted}
          secureTextEntry={isPassword && !passwordVisible}
          style={[styles.input, { color: colors.text }, style]}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            disabled={disabled}
            hitSlop={8}
            onPress={() => setPasswordVisible((value) => !value)}
            style={styles.trailing}
            testID={props.testID ? `${props.testID}-visibility` : undefined}
          >
            <AppIcon color={colors.textMuted} name={passwordVisible ? 'eye' : 'eyeOff'} size={20} />
          </Pressable>
        ) : null}
      </View>
      {helper ? (
        <Text style={[styles.helper, { color: error ? colors.danger : colors.textMuted }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    overflow: 'hidden',
    paddingLeft: themeTokens.spacing.md,
  },
  fieldDisabled: {
    opacity: 0.7,
  },
  helper: {
    fontSize: 12,
    lineHeight: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    minHeight: 48,
    paddingRight: themeTokens.spacing.sm,
    paddingVertical: themeTokens.spacing['12'],
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  stack: {
    gap: themeTokens.spacing['6'],
    width: '100%',
  },
  trailing: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
