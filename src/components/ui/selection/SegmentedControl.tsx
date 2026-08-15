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
 * Full-width segmented control (Figma Selection/SegmentedControl).
 * Active segment is elevated with accent label on a peach track.
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
      style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}
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
                backgroundColor: active ? colors.backgroundElevated : 'transparent',
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
                { color: active ? colors.primary : colors.textMuted },
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
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  labelActive: {
    fontWeight: '600',
  },
  labelIdle: {
    fontWeight: '500',
  },
  segment: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.xs,
    flex: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: themeTokens.spacing['12'],
    paddingVertical: themeTokens.spacing.sm,
  },
  track: {
    alignItems: 'stretch',
    borderRadius: themeTokens.radius.md,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: themeTokens.spacing.xs,
    width: '100%',
  },
});
