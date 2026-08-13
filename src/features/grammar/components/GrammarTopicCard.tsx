import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PublishedTopic } from '@/features/grammar/services';
import { themeTokens, useAppColors } from '@/theme';

export type GrammarTopicStatus = 'not_started' | 'in_progress' | 'completed';

type GrammarTopicCardProps = {
  onPress: () => void;
  progress: number;
  status: GrammarTopicStatus;
  subtitle: string;
  topic: PublishedTopic;
};

const STATUS_LABEL: Record<GrammarTopicStatus, string> = {
  completed: 'COMPLETED',
  in_progress: 'IN PROGRESS',
  not_started: 'NOT STARTED',
};

export function GrammarTopicCard({
  topic,
  status,
  subtitle,
  progress,
  onPress,
}: GrammarTopicCardProps) {
  const colors = useAppColors();
  const ratio = status === 'not_started' ? 0 : Math.max(0, Math.min(1, progress));
  const fillColor = status === 'completed' ? colors.success : colors.primary;
  const highlighted = status === 'in_progress';

  return (
    <Pressable
      accessibilityLabel={`${topic.title}. ${STATUS_LABEL[status]}. ${subtitle}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: highlighted ? colors.primary : colors.borderSubtle,
          borderWidth: highlighted ? 2 : 1,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      testID={`grammar-topic-${topic.slug}`}
    >
      <Text style={[styles.status, { color: colors.primary }]}>{STATUS_LABEL[status]}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{topic.title}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      <View
        accessibilityLabel={`${Math.round(ratio * 100)} percent complete`}
        style={[styles.track, { backgroundColor: colors.borderSubtle }]}
      >
        {ratio > 0 ? (
          <View
            style={[
              styles.fill,
              {
                backgroundColor: fillColor,
                width: `${ratio * 100}%`,
              },
            ]}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: themeTokens.radius.lg,
    gap: themeTokens.spacing['10'],
    padding: themeTokens.spacing.md,
    width: '100%',
  },
  fill: {
    borderRadius: 3,
    height: 6,
  },
  status: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.66,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  track: {
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
});
