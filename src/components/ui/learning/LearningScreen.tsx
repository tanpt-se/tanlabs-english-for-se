import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme';

import type { PropsWithChildren, ReactNode } from 'react';

type LearningScreenProps = PropsWithChildren<{
  /** Gap between stacked children. Default 14 (Grammar). Callers override (Vocabulary 16–24). */
  contentGap?: number;
  header?: ReactNode;
  footer?: ReactNode;
  testID?: string;
}>;

export function LearningScreen({
  children,
  contentGap = 14,
  header,
  footer,
  testID,
}: LearningScreenProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 16);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID={testID}>
      {header ? <View style={[styles.header, { paddingTop: topInset }]}>{header}</View> : null}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          footer ? styles.contentWithFooter : { paddingBottom: Math.max(insets.bottom, 24) },
          header ? styles.contentBelowHeader : { paddingTop: topInset },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.pad, { gap: contentGap }]}>{children}</View>
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  contentBelowHeader: {
    paddingTop: 16,
  },
  contentWithFooter: {
    paddingBottom: 24,
  },
  footer: {
    width: '100%',
  },
  header: {
    paddingHorizontal: 24,
    width: '100%',
  },
  pad: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  root: {
    flex: 1,
  },
});
