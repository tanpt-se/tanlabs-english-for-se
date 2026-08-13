import { Pressable, Text } from 'react-native';

import { authFormStyles } from '@/features/auth/components/authFormStyles';
import { useAppColors } from '@/theme';

import type { PressableProps } from 'react-native';

type AuthLinkProps = Omit<PressableProps, 'children'> & {
  label: string;
};

export function AuthLink({ label, style, ...props }: AuthLinkProps) {
  const colors = useAppColors();

  return (
    <Pressable
      {...props}
      accessibilityRole="link"
      style={(state) => [authFormStyles.link, typeof style === 'function' ? style(state) : style]}
    >
      <Text style={[authFormStyles.linkText, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}
