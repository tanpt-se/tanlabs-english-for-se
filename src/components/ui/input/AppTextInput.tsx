import { StyleSheet, TextInput } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

import type { TextInputProps } from 'react-native';

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
  input: {
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: themeTokens.spacing['14'],
    paddingVertical: themeTokens.spacing['10'],
  },
});
