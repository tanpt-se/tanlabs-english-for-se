import { Pressable, StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type SituationCardProps = {
  description: string;
  onPress?: () => void;
  progress: string;
  selected?: boolean;
  title: string;
};

/** Situation list row used on Vocabulary home (Figma PH3 situation cards). */
export function SituationCard({
  description,
  onPress,
  progress,
  selected = false,
  title,
}: SituationCardProps) {
  const colors = useAppColors();

  return (
    <Pressable
      accessibilityLabel={`${title}, ${progress}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.borderSubtle,
          opacity: pressed && onPress ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <Text style={[styles.progress, { color: colors.primary }]}>{progress}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 74,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing['14'],
  },
  copy: {
    flex: 1,
    gap: themeTokens.spacing['3'],
    paddingRight: themeTokens.spacing['12'],
  },
  description: {
    fontSize: 11,
    lineHeight: 15,
  },
  progress: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
});
