import { Box } from '@gluestack-ui/themed';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PropsWithChildren } from 'react';

type ScreenScrollProps = PropsWithChildren<{
  /** Vertically center content when it fits (auth forms). */
  centered?: boolean;
}>;

export function ScreenScroll({ children, centered = false }: ScreenScrollProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <Box flex={1} bg="$backgroundLight100">
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
          <Box px="$4">{children}</Box>
        </ScrollView>
      </Box>
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
});
