import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppSwitch } from '@/components/ui/selection';
import { themeTokens, useAppColors } from '@/theme';

type SettingRowProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
  /** Trailing chevron when the row navigates. */
  showChevron?: boolean;
  switchValue?: boolean;
  value?: string;
};

/**
 * Settings / profile row. Use `value` + chevron for navigation, or `switchValue`
 * for inline preferences. Minimum row height 56.
 */
export function SettingRow({
  accessibilityLabel,
  disabled = false,
  label,
  onPress,
  onValueChange,
  showChevron = false,
  switchValue,
  value,
}: SettingRowProps) {
  const colors = useAppColors();
  const isSwitch = typeof switchValue === 'boolean';
  const interactive = Boolean(onPress) && !isSwitch;

  const content = (
    <>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {value ? <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text> : null}
      </View>
      {isSwitch ? (
        <AppSwitch
          accessibilityLabel={accessibilityLabel ?? label}
          disabled={disabled || !onValueChange}
          value={switchValue}
          onValueChange={onValueChange}
        />
      ) : showChevron ? (
        <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
      ) : null}
    </>
  );

  if (interactive) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
          pressed ? styles.rowPressed : null,
          disabled ? styles.rowDisabled : null,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
        disabled ? styles.rowDisabled : null,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  chevron: {
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 28,
    marginLeft: themeTokens.spacing.sm,
  },
  copy: {
    flex: 1,
    flexShrink: 1,
    gap: 2,
    marginRight: themeTokens.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowPressed: {
    opacity: 0.85,
  },
  value: {
    fontSize: 12,
    lineHeight: 16,
  },
});
