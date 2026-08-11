import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { useAppColors } from '@/theme';

type AppSwitchProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  onValueChange?: (value: boolean) => void;
  value: boolean;
};

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const THUMB_INSET = 3;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;

/**
 * Brand switch matching Figma Selection/AppSwitch.
 * Visual track 44×28 inside a 52×44 touch target.
 */
export function AppSwitch({
  accessibilityLabel,
  disabled = false,
  onValueChange,
  value,
}: AppSwitchProps) {
  const colors = useAppColors();
  const offset = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    const next = value ? 1 : 0;
    if (process.env.NODE_ENV === 'test') {
      offset.setValue(next);
      return;
    }
    Animated.timing(offset, {
      toValue: next,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [offset, value]);

  const trackColor = offset.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.borderSubtle, colors.primary],
  });

  const thumbTranslate = offset.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_INSET, THUMB_INSET + THUMB_TRAVEL],
  });

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled || !onValueChange}
      hitSlop={4}
      onPress={() => onValueChange?.(!value)}
      style={[styles.hit, disabled ? styles.disabled : null]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: colors.surface,
              transform: [{ translateX: thumbTranslate }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.45,
  },
  hit: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 52,
  },
  thumb: {
    borderRadius: THUMB_SIZE / 2,
    elevation: 2,
    height: THUMB_SIZE,
    position: 'absolute',
    shadowColor: '#0D1E46',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
  },
  track: {
    borderRadius: 999,
    height: TRACK_HEIGHT,
    overflow: 'hidden',
    width: TRACK_WIDTH,
  },
});
