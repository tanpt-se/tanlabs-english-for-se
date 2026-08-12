import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme';

import type { PropsWithChildren, ReactNode } from 'react';

type ScreenScrollProps = PropsWithChildren<{
  /** Vertically center content when it fits (auth forms). */
  centered?: boolean;
  /** Fixed chrome above the scroll area (typically TopAppHeader / AuthHeader). */
  header?: ReactNode;
  /** Sticky footer (e.g. bottom tab bar). */
  footer?: ReactNode;
}>;

export function ScreenScroll({ children, centered = false, header, footer }: ScreenScrollProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const topInset = Math.max(insets.top, 16);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        {header ? <View style={[styles.header, { paddingTop: topInset }]}>{header}</View> : null}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            centered ? styles.centered : undefined,
            header ? styles.contentBelowHeader : { paddingTop: topInset },
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
  contentBelowHeader: {
    paddingTop: 16,
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
  header: {
    paddingHorizontal: 16,
    width: '100%',
  },
  horizontalPadding: {
    paddingHorizontal: 16,
  },
});
