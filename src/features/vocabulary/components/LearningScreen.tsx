import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme';

import type { PropsWithChildren, ReactNode } from 'react';

type LearningScreenProps = PropsWithChildren<{
  footer?: ReactNode;
  testID?: string;
}>;

/** Scrollable learning content with an optional sticky footer (nav / CTA bar). */
export function LearningScreen({ children, footer, testID }: LearningScreenProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID={testID}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          styles.contentPad,
          footer ? styles.contentWithFooter : { paddingBottom: Math.max(insets.bottom, 24) },
          { paddingTop: Math.max(insets.top, 16) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pad}>{children}</View>
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  contentPad: {},
  contentWithFooter: {
    paddingBottom: 24,
  },
  footer: {
    width: '100%',
  },
  pad: {
    gap: 14,
    paddingHorizontal: 24,
  },
  root: {
    flex: 1,
  },
});
