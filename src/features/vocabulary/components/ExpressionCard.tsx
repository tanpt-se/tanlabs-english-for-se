import { Pressable, StyleSheet, Text } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type ExpressionCardProps = {
  emphasis?: boolean;
  meta?: string;
  onPress?: () => void;
  tag: string;
  title: string;
};

/**
 * Expression / review list row (Figma PH3 phrase cards).
 * Optional `meta` supports Needs-practice rows (intent + tag).
 */
export function ExpressionCard({
  emphasis = false,
  meta,
  onPress,
  tag,
  title,
}: ExpressionCardProps) {
  const colors = useAppColors();

  return (
    <Pressable
      accessibilityLabel={meta ? `${title}. ${meta}. ${tag}` : `${title}. ${tag}`}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: emphasis ? colors.primarySoft : colors.surface,
          borderColor: emphasis ? colors.primary : colors.borderSubtle,
          opacity: pressed && onPress ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {meta ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{meta}</Text> : null}
      <Text style={[styles.tag, { color: colors.textMuted }]}>{tag}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: themeTokens.radius.card,
    borderWidth: 1,
    gap: themeTokens.spacing.sm,
    padding: themeTokens.spacing.md,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  tag: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.4,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    lineHeight: 21,
  },
});
