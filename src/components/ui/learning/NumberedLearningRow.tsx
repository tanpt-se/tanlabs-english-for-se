import { Pressable, StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

export type NumberedRowTone = 'completed' | 'active' | 'upcoming';

type NumberedLearningRowProps = {
  accessibilityLabel?: string;
  index: number;
  onPress: () => void;
  subtitle: string;
  testID?: string;
  title: string;
  tone: NumberedRowTone;
  trailing?: string;
};

/** Numbered catalog row (Figma topic / lesson / core list). Upcoming stays tappable. */
export function NumberedLearningRow({
  accessibilityLabel,
  index,
  onPress,
  subtitle,
  testID,
  title,
  tone,
  trailing,
}: NumberedLearningRowProps) {
  const colors = useAppColors();
  const completed = tone === 'completed';
  const active = tone === 'active';
  const upcoming = tone === 'upcoming';
  const glyph = trailing ?? (completed ? '✓' : active ? '→' : '');
  const titleColor = upcoming ? colors.textMuted : colors.text;
  const descriptionColor = upcoming ? colors.textMuted : colors.textSecondary;
  const rowBackground = completed
    ? colors.successSoft
    : active
    ? colors.surface
    : colors.primarySoft;
  const badgeBackground = completed ? colors.success : active ? colors.primary : 'transparent';
  const badgeText = completed || active ? colors.textInverse : colors.textMuted;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: rowBackground,
          borderColor: completed ? colors.success : active ? colors.border : 'transparent',
          borderWidth: completed || active ? 1 : 0,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.indexBadge,
          {
            backgroundColor: badgeBackground,
          },
        ]}
      >
        <Text style={[styles.indexText, { color: badgeText }]}>{index}</Text>
      </View>
      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            active || completed ? styles.titleStrong : null,
            { color: titleColor },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: descriptionColor }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      {glyph ? (
        <Text
          style={[styles.trailing, { color: completed ? colors.success : colors.textSecondary }]}
        >
          {glyph}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: 2,
  },
  indexBadge: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  row: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.card,
    flexDirection: 'row',
    gap: themeTokens.spacing['14'],
    minHeight: 64,
    paddingHorizontal: themeTokens.spacing['14'],
    paddingVertical: themeTokens.spacing['10'],
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
  },
  titleStrong: {
    fontWeight: '600',
  },
  trailing: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
