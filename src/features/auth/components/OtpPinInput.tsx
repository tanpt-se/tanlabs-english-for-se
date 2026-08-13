import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

import type { TextInputProps } from 'react-native';

type OtpPinInputProps = {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  accessibilityLabel?: string;
  autoComplete?: TextInputProps['autoComplete'];
  error?: boolean;
  label?: string;
  length?: number;
  onChange: (value: string) => void;
  showLabel?: boolean;
  testID?: string;
  textContentType?: TextInputProps['textContentType'];
  value: string;
};

/** Six single-digit boxes with one hidden numeric input (signup / OTP flows). */
export function OtpPinInput({
  accessibilityLabel = 'Verification code',
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  autoComplete = 'one-time-code',
  error = false,
  label = 'Verification code',
  length = 6,
  onChange,
  showLabel = true,
  testID,
  textContentType = 'oneTimeCode',
  value,
}: OtpPinInputProps) {
  const colors = useAppColors();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = Array.from({ length }, (_, index) => value[index] ?? '');
  const invalid = Boolean(error || ariaInvalid);

  const onChangeText = (next: string) => {
    onChange(next.replace(/\D/g, '').slice(0, length));
  };

  return (
    <View style={styles.stack}>
      {showLabel ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={() => inputRef.current?.focus()}
        style={styles.row}
        testID={testID ? `${testID}-boxes` : undefined}
      >
        {digits.map((digit, index) => {
          const active = focused && index === value.length;
          const filled = digit.length > 0;
          const borderColor = invalid
            ? colors.danger
            : active
            ? colors.primary
            : filled
            ? colors.border
            : colors.borderSubtle;

          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  backgroundColor: colors.surface,
                  borderColor,
                },
              ]}
            >
              <Text style={[styles.digit, { color: colors.text }]}>{digit}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        accessibilityLabel={accessibilityLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid ?? invalid}
        autoComplete={autoComplete}
        importantForAutofill="yes"
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        testID={testID}
        textContentType={textContentType}
        value={value}
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
      />
    </View>
  );
}

const PIN_RADIUS = 8;

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    borderRadius: PIN_RADIUS,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 44,
  },
  digit: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    textAlign: 'center',
  },
  hiddenInput: {
    height: 1,
    opacity: 0,
    position: 'absolute',
    width: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: themeTokens.spacing.sm,
    width: '100%',
  },
  stack: {
    gap: themeTokens.spacing['14'],
    width: '100%',
  },
});
