import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import type { GrammarStackParamList } from '@/app/navigation/types';
import { ScreenScroll } from '@/components/ui/layout';
import { TopAppHeader } from '@/components/ui/navigation';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/** Placeholder practice — filled by PH2-08. */
export function GrammarPracticeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GrammarStackParamList>>();
  const route = useRoute<RouteProp<GrammarStackParamList, 'GrammarPractice'>>();
  const colors = useAppColors();

  return (
    <ScreenScroll>
      <View style={styles.stack} testID="grammar-practice">
        <TopAppHeader showBack title="Practice" onBackPress={() => navigation.goBack()} />
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Practice for lesson `{route.params.lessonId}` — engine UI pending.
        </Text>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  stack: {
    gap: themeTokens.spacing.md,
    width: '100%',
  },
});
