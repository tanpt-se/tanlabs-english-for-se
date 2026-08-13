import { Pressable, StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

export type SegmentOption<T extends string> = {
  key: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (key: T) => void;
  testID?: string;
};

/**
 * Full-width equal-height segmented control (iOS-style).
 * Each option fills available width; active segment uses primary soft fill.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  testID,
}: SegmentedControlProps<T>) {
  const colors = useAppColors();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.track,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.borderSubtle,
        },
      ]}
      testID={testID}
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.key)}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: active ? colors.surface : 'transparent',
                borderColor: active ? colors.border : 'transparent',
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            testID={testID ? `${testID}-${option.key}` : undefined}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                active ? styles.labelActive : styles.labelIdle,
                { color: active ? colors.text : colors.textMuted },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  labelActive: {
    fontWeight: '700',
  },
  labelIdle: {
    fontWeight: '600',
  },
  segment: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.md - 2,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  track: {
    alignItems: 'stretch',
    borderRadius: themeTokens.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    width: '100%',
  },
});
