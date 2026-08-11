import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/button';
import { themeTokens, useAppColors } from '@/theme';

import type { PressableProps } from 'react-native';

type BottomActionBarProps = {
  disabled?: boolean;
  label: string;
  onPress?: PressableProps['onPress'];
  testID?: string;
};

/** Sticky bottom action area for focused learning flows. */
export function BottomActionBar({ disabled, label, onPress, testID }: BottomActionBarProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.borderSubtle,
          paddingBottom: Math.max(insets.bottom, themeTokens.spacing.lg),
        },
      ]}
    >
      <AppButton
        accessibilityLabel={label}
        accessibilityRole="button"
        disabled={disabled}
        label={label}
        onPress={onPress}
        style={styles.button}
        testID={testID}
        variant="solid"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    paddingHorizontal: themeTokens.spacing.lg,
    paddingTop: themeTokens.spacing.md,
  },
  button: {
    alignSelf: 'stretch',
    minWidth: undefined,
    width: '100%',
  },
});
