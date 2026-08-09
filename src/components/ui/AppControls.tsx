import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { useAppColors } from '@/theme';

import type { PressableProps, TextInputProps } from 'react-native';

type AppButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  tone?: 'default' | 'danger';
  variant?: 'solid' | 'outline';
};

type AppFormErrorProps = {
  message: string;
  nativeID?: string;
};

export function AppButton({
  disabled,
  label,
  style,
  tone = 'default',
  variant = 'solid',
  ...props
}: AppButtonProps) {
  const colors = useAppColors();
  const accent = tone === 'danger' ? colors.danger : colors.primary;
  const onAccent = tone === 'danger' ? colors.onDanger : colors.onPrimary;
  const labelStyle = { color: variant === 'solid' ? onAccent : accent };

  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={(state) => [
        styles.button,
        {
          backgroundColor: variant === 'solid' ? accent : 'transparent',
          borderColor: accent,
          opacity: disabled ? 0.5 : state.pressed ? 0.75 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Text style={[styles.buttonLabel, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

export function AppFormError({ message, nativeID }: AppFormErrorProps) {
  const colors = useAppColors();

  return (
    <Text
      nativeID={nativeID}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[styles.error, { color: colors.danger }]}
    >
      {message}
    </Text>
  );
}

export function AppTextInput(props: TextInputProps) {
  const colors = useAppColors();

  return (
    <TextInput
      {...props}
      placeholderTextColor={props.placeholderTextColor ?? colors.textMuted}
      style={[
        styles.input,
        { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
