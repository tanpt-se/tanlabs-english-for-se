import { Image, StyleSheet, View } from 'react-native';

import type { ImageStyle, StyleProp } from 'react-native';

const icons = {
  arrowLeft: require('../../../assets/icons/arrow-left.png'),
  book: require('../../../assets/icons/book.png'),
  eye: require('../../../assets/icons/eye.png'),
  eyeOff: require('../../../assets/icons/eye-off.png'),
  home: require('../../../assets/icons/home.png'),
  interview: require('../../../assets/icons/interview.png'),
  user: require('../../../assets/icons/user.png'),
  vocabulary: require('../../../assets/icons/vocabulary.png'),
} as const;

export type AppIconName = keyof typeof icons;

type AppIconProps = {
  color?: string;
  name: AppIconName;
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/** 24px outline icons (white template PNGs) — pass `color` for tint. */
export function AppIcon({ color, name, size = 24, style }: AppIconProps) {
  return (
    <View style={[styles.box, { height: size, width: size }]}>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={icons[name]}
        style={[
          styles.leaf,
          {
            height: size,
            tintColor: color,
            width: size,
          },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  leaf: {
    height: '100%',
    width: '100%',
  },
});
