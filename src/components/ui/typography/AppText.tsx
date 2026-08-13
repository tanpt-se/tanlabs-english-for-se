import { Text } from 'react-native';

import { textStyles, useAppColors } from '@/theme';
import type { TextVariant } from '@/theme';

import type { TextProps, TextStyle } from 'react-native';

type AppTextProps = Omit<TextProps, 'style'> & {
  /** Figma Typography/AppText Type=… */
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
  style?: TextStyle | TextStyle[];
};

/**
 * Typography primitive mapped to Figma `Typography/AppText` text styles.
 * Uses System font (SF Pro on iOS) — Inter in Figma is the design reference only.
 */
export function AppText({
  variant = 'body',
  color,
  align,
  weight,
  style,
  children,
  ...props
}: AppTextProps) {
  const colors = useAppColors();
  const base = textStyles[variant];

  return (
    <Text
      {...props}
      style={[
        base,
        {
          color: color ?? colors.text,
          textAlign: align,
          fontWeight: weight ?? base.fontWeight,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
