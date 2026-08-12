import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import type { VocabularyStackParamList } from '@/app/navigation/types';
import { LearningScreen } from '@/components/ui/learning';
import { BottomActionBar } from '@/components/ui/navigation';
import { TopAppHeader } from '@/components/ui/navigation';
import { ExpressionCard } from '@/features/vocabulary/components';
import {
  getExpressions,
  getPracticeQuestions,
  getSituation,
} from '@/features/vocabulary/data/mockCatalog';
import { useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function SituationDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyStackParamList>>();
  const route = useRoute<RouteProp<VocabularyStackParamList, 'VocabularySituation'>>();
  const colors = useAppColors();
  const situation = getSituation(route.params.situationId);
  const expressions = getExpressions(route.params.situationId);
  const practiceCount = getPracticeQuestions(route.params.situationId).length;
  const title = situation?.title ?? 'Situation';
  const description =
    situation?.description ?? 'Give clear updates, surface blockers, and align next steps.';

  return (
    <LearningScreen
      testID="vocabulary-situation"
      header={<TopAppHeader showBack title={title} onBackPress={() => navigation.goBack()} />}
      footer={
        <BottomActionBar
          label={`Practice ${practiceCount} question${practiceCount === 1 ? '' : 's'}`}
          testID="practice-cta"
          onPress={() =>
            navigation.navigate('VocabularyPractice', {
              situationId: route.params.situationId,
            })
          }
        />
      }
    >
      <Text style={[styles.blurb, { color: colors.textSecondary }]}>{description}</Text>
      <View style={styles.list}>
        {expressions.map((expression) => (
          <ExpressionCard
            key={expression.id}
            title={expression.text}
            tag={expression.tag}
            meta={expression.intent}
            emphasis={Boolean(expression.needsPractice)}
          />
        ))}
      </View>
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  blurb: {
    fontSize: 15,
    lineHeight: 21,
  },
  list: {
    gap: 14,
  },
});
