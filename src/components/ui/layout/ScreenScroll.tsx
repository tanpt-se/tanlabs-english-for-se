import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme';

import type { PropsWithChildren, ReactNode } from 'react';

type ScreenScrollProps = PropsWithChildren<{
  /** Vertically center content when it fits (auth forms). */
  centered?: boolean;
  /** Sticky footer (e.g. bottom tab bar). */
  footer?: ReactNode;
}>;

export function ScreenScroll({ children, centered = false, footer }: ScreenScrollProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            centered ? styles.centered : undefined,
            { paddingTop: Math.max(insets.top, 16) },
            footer ? styles.contentWithFooter : { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <View style={styles.horizontalPadding}>{children}</View>
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
  },
  contentWithFooter: {
    paddingBottom: 24,
  },
  flex: {
    flex: 1,
  },
  footer: {
    width: '100%',
  },
  horizontalPadding: {
    paddingHorizontal: 16,
  },
});
