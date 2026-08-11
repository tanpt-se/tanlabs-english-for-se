import { Pressable, StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

export type AnswerOptionState = 'default' | 'selected' | 'correct' | 'incorrect';

type AnswerOptionProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  state?: AnswerOptionState;
};

/** Selectable full-width answer row. States: default, selected, correct, incorrect. */
export function AnswerOption({
  accessibilityLabel,
  disabled,
  label,
  onPress,
  state = 'default',
}: AnswerOptionProps) {
  const colors = useAppColors();

  const chrome = (() => {
    switch (state) {
      case 'selected':
        return {
          background: colors.primarySoft,
          border: colors.primary,
          indicator: colors.primary,
          indicatorGlyph: '●',
          text: colors.text,
        };
      case 'correct':
        return {
          background: colors.successSoft,
          border: colors.success,
          indicator: colors.success,
          indicatorGlyph: '✓',
          text: colors.text,
        };
      case 'incorrect':
        return {
          background: colors.dangerSoft,
          border: colors.danger,
          indicator: colors.danger,
          indicatorGlyph: '✕',
          text: colors.text,
        };
      default:
        return {
          background: colors.surface,
          border: colors.border,
          indicator: colors.border,
          indicatorGlyph: '○',
          text: colors.text,
        };
    }
  })();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled), selected: state === 'selected' }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: chrome.background,
          borderColor: chrome.border,
          opacity: pressed && onPress && !disabled ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.indicator, { borderColor: chrome.indicator }]}>
        <Text style={[styles.indicatorGlyph, { color: chrome.indicator }]}>
          {chrome.indicatorGlyph}
        </Text>
      </View>
      <Text style={[styles.label, { color: chrome.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  indicator: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    marginTop: 1,
    width: 20,
  },
  indicatorGlyph: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  label: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  row: {
    alignItems: 'flex-start',
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: themeTokens.spacing['12'],
    minHeight: 56,
    padding: themeTokens.spacing.md,
  },
});
