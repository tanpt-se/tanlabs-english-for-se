import { Pressable, StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

type ReviewNeededCardProps = {
  count: number;
  onPress: () => void;
  testID?: string;
};

/** Weak-item reminder on Home (Figma Weak Items Reminder Card). */
export function ReviewNeededCard({
  count,
  onPress,
  testID = 'home-review-needed',
}: ReviewNeededCardProps) {
  const colors = useAppColors();
  const itemLabel =
    count === 1 ? '1 vocabulary item needs practice' : `${count} vocabulary items need practice`;

  return (
    <Pressable
      accessibilityLabel={`Review needed, ${itemLabel}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.primarySoft,
          borderColor: colors.borderSubtle,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      testID={testID}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.dangerSoft }]}>
        <Text style={[styles.bang, { color: colors.primary }]}>!</Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.primary }]}>Review needed</Text>
        <Text style={[styles.body, { color: colors.text }]}>{itemLabel}</Text>
      </View>
      <Text style={[styles.action, { color: colors.primary }]}>Review now</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    fontSize: themeTokens.typography.size.bodySmall,
    fontWeight: '600',
    lineHeight: themeTokens.typography.lineHeight.bodySmall,
    textDecorationLine: 'underline',
  },
  bang: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  body: {
    fontSize: themeTokens.typography.size.bodySmall,
    fontWeight: '400',
    lineHeight: themeTokens.typography.lineHeight.bodySmall,
  },
  card: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: themeTokens.spacing['12'],
    padding: themeTokens.spacing['12'],
    width: '100%',
  },
  copy: {
    flex: 1,
    flexShrink: 1,
    gap: themeTokens.spacing.xs,
    minWidth: 0,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.lg,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  title: {
    fontSize: themeTokens.typography.size.bodySmall,
    fontWeight: '600',
    lineHeight: themeTokens.typography.lineHeight.bodySmall,
  },
});
