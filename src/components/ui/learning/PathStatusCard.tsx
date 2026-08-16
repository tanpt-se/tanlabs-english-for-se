import { Pressable, StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

export type PathStatus = 'not_started' | 'in_progress' | 'completed';

const STATUS_LABEL: Record<PathStatus, string> = {
  completed: 'COMPLETED',
  in_progress: 'IN PROGRESS',
  not_started: 'NOT STARTED',
};

type PathStatusCardProps = {
  accessibilityLabel?: string;
  onPress?: () => void;
  progress: number;
  status: PathStatus;
  subtitle: string;
  testID?: string;
  title: string;
};

/** Figma category / situation card: status, title, meta, coral progress. */
export function PathStatusCard({
  accessibilityLabel,
  onPress,
  progress,
  status,
  subtitle,
  testID,
  title,
}: PathStatusCardProps) {
  const colors = useAppColors();
  const ratio = status === 'not_started' ? 0 : Math.max(0, Math.min(1, progress));
  const fillColor = status === 'completed' ? colors.success : colors.primary;
  const highlighted = status === 'in_progress';
  const disabled = !onPress;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? `${title}. ${STATUS_LABEL[status]}. ${subtitle}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: highlighted ? colors.primary : colors.borderSubtle,
          borderWidth: highlighted ? 1.5 : 1,
          opacity: pressed && onPress ? 0.9 : 1,
        },
      ]}
      testID={testID}
    >
      <Text style={[styles.status, { color: colors.primary }]}>{STATUS_LABEL[status]}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
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
                width: `${Math.max(ratio * 100, 4)}%`,
              },
            ]}
          />
        ) : (
          <View style={[styles.seed, { backgroundColor: colors.primary }]} />
        )}
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
  seed: {
    borderRadius: 3,
    height: 6,
    width: 8,
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
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
