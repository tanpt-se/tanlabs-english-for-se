import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/ui/brand';
import { themeTokens, useAppColors } from '@/theme';

export type BottomNavDestination = 'home' | 'grammar' | 'vocabulary' | 'interview' | 'profile';

type BottomNavigationProps = {
  active: BottomNavDestination;
  disabledDestinations?: readonly BottomNavDestination[];
  onSelect?: (destination: BottomNavDestination) => void;
};

const DESTINATIONS: Array<{
  key: BottomNavDestination;
  label: string;
  icon: AppIconName;
}> = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'grammar', label: 'Grammar', icon: 'book' },
  { key: 'vocabulary', label: 'Vocabulary', icon: 'vocabulary' },
  { key: 'interview', label: 'Interview', icon: 'interview' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

/** Five-destination mobile bottom navigation. Active uses accent; inactive uses muted text. */
export function BottomNavigation({
  active,
  disabledDestinations = [],
  onSelect,
}: BottomNavigationProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          paddingBottom: Math.max(insets.bottom, themeTokens.spacing.sm),
        },
      ]}
    >
      {DESTINATIONS.map(({ key, label, icon }) => {
        const isActive = key === active;
        const isDisabled = !onSelect || disabledDestinations.includes(key);
        const tint = isDisabled ? colors.textMuted : isActive ? colors.primary : colors.textMuted;
        return (
          <Pressable
            key={key}
            accessibilityLabel={label}
            accessibilityRole="tab"
            accessibilityState={{ disabled: isDisabled, selected: isActive }}
            disabled={isDisabled}
            onPress={() => onSelect?.(key)}
            style={({ pressed }) => [
              styles.item,
              { opacity: isDisabled ? 0.45 : pressed ? 0.7 : 1 },
            ]}
            testID={`bottom-nav-${key}`}
          >
            <AppIcon color={tint} name={icon} size={24} />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: tint }, isActive ? styles.labelActive : null]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 76,
    paddingHorizontal: themeTokens.spacing['14'],
    paddingTop: themeTokens.spacing['10'],
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: themeTokens.spacing['6'],
    minHeight: 48,
    minWidth: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: '400',
  },
  labelActive: {
    fontWeight: '500',
  },
});
