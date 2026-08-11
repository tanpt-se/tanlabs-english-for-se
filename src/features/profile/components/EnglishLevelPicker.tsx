import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ENGLISH_LEVELS } from '@/core/profile/validation';
import { themeTokens, useAppColors } from '@/theme';

type EnglishLevel = (typeof ENGLISH_LEVELS)[number];

type EnglishLevelPickerProps = {
  onChange: (level: EnglishLevel) => void;
  value: EnglishLevel;
};

const LEVEL_LABELS: Record<EnglishLevel, string> = {
  A1: 'A1 · Beginner',
  A2: 'A2 · Elementary',
  B1: 'B1 · Intermediate',
  B2: 'B2 · Upper intermediate',
  C1: 'C1 · Advanced',
};

/** Vertical radio list for CEFR level selection (PH1 Complete / Edit profile). */
export function EnglishLevelPicker({ onChange, value }: EnglishLevelPickerProps) {
  const colors = useAppColors();

  return (
    <View style={styles.container}>
      {ENGLISH_LEVELS.map((level) => {
        const selected = value === level;
        return (
          <Pressable
            key={level}
            accessibilityLabel={`English level ${LEVEL_LABELS[level]}`}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(level)}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: selected ? colors.primarySoft : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.radio,
                selected ? null : styles.radioUnselected,
                {
                  backgroundColor: selected ? colors.primary : undefined,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            />
            <Text style={[styles.label, { color: colors.text }]}>{LEVEL_LABELS[level]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: themeTokens.spacing['14'],
    width: '100%',
  },
  label: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
  },
  radio: {
    borderRadius: 9,
    borderWidth: 2,
    height: 18,
    width: 18,
  },
  radioUnselected: {
    backgroundColor: 'transparent',
  },
  row: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: themeTokens.spacing['12'],
    height: 48,
    paddingLeft: themeTokens.spacing['14'],
    paddingRight: themeTokens.spacing.md,
  },
});
