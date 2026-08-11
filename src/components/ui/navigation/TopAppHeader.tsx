import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/brand';
import { themeTokens, useAppColors } from '@/theme';

type TopAppHeaderProps = {
  backAccessibilityLabel?: string;
  onBackPress?: () => void;
  showBack?: boolean;
  title: string;
};

/** Compact screen header with optional back navigation. */
export function TopAppHeader({
  backAccessibilityLabel = 'Go back',
  onBackPress,
  showBack = false,
  title,
}: TopAppHeaderProps) {
  const colors = useAppColors();

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          accessibilityLabel={backAccessibilityLabel}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBackPress}
          style={({ pressed }) => [styles.backHit, { opacity: pressed ? 0.6 : 1 }]}
        >
          <AppIcon color={colors.text} name="arrowLeft" size={24} />
        </Pressable>
      ) : null}
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backHit: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginLeft: -10,
    minWidth: 44,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: themeTokens.spacing.xs,
    minHeight: 56,
  },
  title: {
    flexShrink: 1,
    fontSize: themeTokens.typography.size.lg,
    fontWeight: '600',
  },
});
