import { View } from 'react-native';

import { ScreenScroll } from '@/components/ui/layout';
import { authFormStyles } from '@/features/auth/components/authFormStyles';
import { AuthHeader } from '@/features/auth/components/AuthHeader';

import type { PropsWithChildren, ReactNode } from 'react';

type AuthFormScreenProps = PropsWithChildren<{
  /** Optional override for the header block (defaults to AuthHeader). */
  header?: ReactNode;
  showLogo?: boolean;
  subtitle?: string;
  title: string;
}>;

/** Centered auth column — Figma V2 Auth forms (342 × 24 padding, gap 40). */
export function AuthFormScreen({
  children,
  header,
  showLogo = true,
  subtitle,
  title,
}: AuthFormScreenProps) {
  return (
    <ScreenScroll centered contentMaxWidth={342} horizontalPadding={24}>
      <View style={authFormStyles.stack}>
        {header ?? <AuthHeader showLogo={showLogo} subtitle={subtitle} title={title} />}
        {children}
      </View>
    </ScreenScroll>
  );
}
