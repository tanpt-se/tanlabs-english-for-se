import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import type { GrammarStackParamList } from '@/app/navigation/types';
import { ScreenScroll } from '@/components/ui/layout';
import { TopAppHeader } from '@/components/ui/navigation';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/** Placeholder result — filled by PH2-10. Params: clientAttemptId only. */
export function GrammarResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GrammarStackParamList>>();
  const route = useRoute<RouteProp<GrammarStackParamList, 'GrammarResult'>>();
  const colors = useAppColors();

  return (
    <ScreenScroll>
      <View style={styles.stack} testID="grammar-result">
        <TopAppHeader
          showBack
          title="Result"
          onBackPress={() => navigation.navigate('GrammarHome')}
        />
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Attempt `{route.params.clientAttemptId}` — score summary pending.
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
