import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import type { AppStackParamList } from '@/app/navigation/types';
import { BottomActionBar } from '@/components/ui/navigation';
import { TopAppHeader } from '@/components/ui/navigation';
import {
  CompletionHero,
  Feedback,
  LearningScreen,
  ResultMetric,
} from '@/features/vocabulary/components';
import { getSituation } from '@/features/vocabulary/data/mockCatalog';
import { useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function PracticeResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'VocabularyResult'>>();
  const colors = useAppColors();
  const situation = getSituation(route.params.situationId);
  const { correct, total } = route.params;
  const needsPractice = Math.max(total - correct, 0);
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);

  return (
    <LearningScreen
      testID="vocabulary-result"
      footer={
        <BottomActionBar
          label="Back to situations"
          testID="result-cta"
          onPress={() => navigation.navigate('VocabularyHome')}
        />
      }
    >
      <TopAppHeader
        showBack
        title="Practice result"
        onBackPress={() => navigation.navigate('VocabularyHome')}
      />
      <CompletionHero
        situation={(situation?.title ?? 'Situation').toUpperCase()}
        title="Practice complete"
        message={`You got ${correct} of ${total} correct. ${needsPractice} expression${
          needsPractice === 1 ? '' : 's'
        } ${needsPractice === 1 ? 'is' : 'are'} ready for focused practice.`}
      />
      <Text style={[styles.section, { color: colors.text }]}>Summary</Text>
      <View style={styles.metrics}>
        <ResultMetric type="correct" value={String(correct)} />
        <ResultMetric type="needsPractice" value={String(needsPractice)} />
        <ResultMetric type="score" value={`${score}%`} />
      </View>
      <Feedback
        type="success"
        title="Session complete"
        message={
          needsPractice > 0
            ? `${needsPractice} expression${
                needsPractice === 1 ? '' : 's'
              } marked for more practice in this session.`
            : 'Great work — all expressions in this set were clear.'
        }
      />
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    gap: 9,
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
});
