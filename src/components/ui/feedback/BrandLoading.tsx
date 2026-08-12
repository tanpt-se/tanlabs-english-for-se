import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BrandLogo } from '@/components/ui/brand/BrandLogo';
import { useAppColors } from '@/theme';

export type BrandLoadingSize = 'sm' | 'md' | 'lg';

type BrandLoadingProps = {
  size?: BrandLoadingSize;
  color?: string;
  /** Expand to fill the parent and center the mark (screen / section loading). */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

/** Figma Feedback/BrandLoading: Small 48 / Medium 72 / Large 120. */
const SIZE_SPEC: Record<
  BrandLoadingSize,
  { box: number; logo: number; ring: number; stroke: number }
> = {
  sm: { box: 48, logo: 24, ring: 40, stroke: 2.5 },
  md: { box: 72, logo: 36, ring: 60, stroke: 3 },
  lg: { box: 120, logo: 64, ring: 104, stroke: 3.5 },
};

const ORBIT_MS = 1000;
const TRACK_OPACITY = 0.18;

/**
 * Brand mark with a coral orbit ring.
 * Rotate only an outer wrapper (transform) so borders stay on a non-Animated child —
 * avoids native-driver crashes when borders sit on the same Animated.View as transform.
 */
export function BrandLoading({
  size = 'md',
  color,
  fill = false,
  style,
  testID,
  accessibilityLabel = 'Loading',
}: BrandLoadingProps) {
  const colors = useAppColors();
  const orbitColor = color ?? colors.primary;
  const spec = SIZE_SPEC[size];
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: ORBIT_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
      spin.setValue(0);
    };
  }, [spin]);

  const rotate = useMemo(
    () =>
      spin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [spin],
  );

  const ringBox = {
    width: spec.ring,
    height: spec.ring,
    borderRadius: spec.ring / 2,
    borderWidth: spec.stroke,
  } as const;

  const mark = (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={[styles.mark, { height: spec.box, width: spec.box }, !fill ? style : undefined]}
      testID={fill ? undefined : testID}
    >
      <View
        pointerEvents="none"
        style={[styles.ring, styles.track, ringBox, { borderColor: orbitColor }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orbit,
          {
            width: spec.ring,
            height: spec.ring,
            transform: [{ rotate }],
          },
        ]}
      >
        <View
          style={[
            styles.sweep,
            ringBox,
            {
              borderTopColor: orbitColor,
              borderRightColor: orbitColor,
            },
          ]}
        />
      </Animated.View>
      <BrandLogo size={spec.logo} style={styles.logo} />
    </View>
  );

  if (!fill) {
    return mark;
  }

  return (
    <View style={[styles.fill, style]} testID={testID}>
      {mark}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  mark: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  orbit: {
    position: 'absolute',
  },
  track: {
    opacity: TRACK_OPACITY,
  },
  sweep: {
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  logo: {
    alignSelf: 'center',
  },
});
