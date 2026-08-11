import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import type { GrammarStackParamList } from '@/app/navigation/types';
import { ScreenScroll } from '@/components/ui/layout';
import { TopAppHeader } from '@/components/ui/navigation';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/** Placeholder lesson — filled by PH2-07. */
export function GrammarLessonScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GrammarStackParamList>>();
  const route = useRoute<RouteProp<GrammarStackParamList, 'GrammarLesson'>>();
  const colors = useAppColors();

  return (
    <ScreenScroll>
      <View style={styles.stack} testID="grammar-lesson">
        <TopAppHeader showBack title="Lesson" onBackPress={() => navigation.goBack()} />
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Lesson `{route.params.lessonId}` in topic `{route.params.topicId}` — content pending.
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
