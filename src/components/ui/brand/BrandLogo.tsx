import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

const source = require('../../../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png');

export function BrandLogo({ size = 112, style }: BrandLogoProps) {
  return (
    <Image
      accessibilityLabel="TanLabs logo"
      accessibilityRole="image"
      resizeMode="contain"
      source={source}
      style={[styles.logo, { height: size, width: size }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});
