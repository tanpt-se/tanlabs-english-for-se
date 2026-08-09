import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ENGLISH_LEVELS } from '@/core/profile/validation';
import { useAppColors } from '@/theme';

type EnglishLevel = (typeof ENGLISH_LEVELS)[number];

type EnglishLevelPickerProps = {
  onChange: (level: EnglishLevel) => void;
  value: EnglishLevel;
};

export function EnglishLevelPicker({ onChange, value }: EnglishLevelPickerProps) {
  const colors = useAppColors();

  return (
    <View style={styles.container}>
      {ENGLISH_LEVELS.map((level) => {
        const selected = value === level;
        const labelStyle = { color: selected ? colors.onPrimary : colors.text };
        return (
          <Pressable
            key={level}
            accessibilityLabel={`English level ${level}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(level)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Text style={labelStyle}>{selected ? `✓ ${level}` : level}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
