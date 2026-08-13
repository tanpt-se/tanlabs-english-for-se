import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PublishedLesson } from '@/features/grammar/services';
import { themeTokens, useAppColors } from '@/theme';

type GrammarLessonRowProps = {
  active: boolean;
  bestScorePercent: number | null;
  completed: boolean;
  index: number;
  lesson: PublishedLesson;
  onPress: () => void;
};

export function GrammarLessonRow({
  active,
  bestScorePercent,
  completed,
  index,
  lesson,
  onPress,
}: GrammarLessonRowProps) {
  const colors = useAppColors();
  const upcoming = !completed && !active && bestScorePercent === null;
  const trailing = completed
    ? '✓'
    : bestScorePercent !== null
    ? `${bestScorePercent}%`
    : active
    ? '→'
    : '';
  const titleColor = upcoming ? colors.textMuted : colors.text;
  const descriptionColor = upcoming ? colors.textMuted : colors.textSecondary;
  const status = completed
    ? `Completed · ${bestScorePercent ?? 100}%`
    : bestScorePercent !== null
    ? `Best ${bestScorePercent}%`
    : active
    ? 'Continue'
    : 'Start';
  const rowBackground = completed
    ? colors.successSoft
    : active
    ? colors.surface
    : colors.background;
  const badgeBackground = completed
    ? colors.success
    : active
    ? colors.primary
    : colors.surfaceSecondary;
  const badgeText = completed || active ? colors.textInverse : colors.textMuted;

  return (
    <Pressable
      accessibilityLabel={`${lesson.title}. ${lesson.description}. ${status}`}
      accessibilityRole="button"
      testID={`grammar-lesson-row-${lesson.slug}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: rowBackground,
          borderColor: completed ? colors.success : 'transparent',
          borderWidth: completed ? 1 : 0,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.indexBadge,
          {
            backgroundColor: badgeBackground,
          },
        ]}
      >
        <Text style={[styles.indexText, { color: badgeText }]}>{index + 1}</Text>
      </View>
      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            active || completed ? styles.titleActive : null,
            { color: titleColor },
          ]}
          numberOfLines={1}
        >
          {lesson.title}
        </Text>
        <Text style={[styles.description, { color: descriptionColor }]} numberOfLines={2}>
          {lesson.description}
        </Text>
      </View>
      {trailing ? (
        <Text
          style={[styles.trailing, { color: completed ? colors.success : colors.textSecondary }]}
        >
          {trailing}
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
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  indexBadge: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.card,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '500',
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
  title: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
  },
  titleActive: {
    fontWeight: '600',
  },
  trailing: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
