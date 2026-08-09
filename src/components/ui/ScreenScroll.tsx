import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme';

import type { PropsWithChildren } from 'react';

type ScreenScrollProps = PropsWithChildren<{
  /** Vertically center content when it fits (auth forms). */
  centered?: boolean;
}>;

export function ScreenScroll({ children, centered = false }: ScreenScrollProps) {
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
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          <View style={styles.horizontalPadding}>{children}</View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  centered: {
    justifyContent: 'center',
  },
  horizontalPadding: {
    paddingHorizontal: 16,
  },
});
