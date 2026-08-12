import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { VocabularyStackParamList } from '@/app/navigation/types';
import { PracticeResultScreen } from '@/features/vocabulary/screens/PracticeResultScreen';
import { PracticeScreen } from '@/features/vocabulary/screens/PracticeScreen';
import { SituationDetailScreen } from '@/features/vocabulary/screens/SituationDetailScreen';
import { VocabularyHomeScreen } from '@/features/vocabulary/screens/VocabularyHomeScreen';

const VocabularyStack = createNativeStackNavigator<VocabularyStackParamList>();

export function VocabularyNavigator() {
  return (
    <VocabularyStack.Navigator screenOptions={{ headerShown: false }}>
      <VocabularyStack.Screen name="VocabularyHome" component={VocabularyHomeScreen} />
      <VocabularyStack.Screen name="VocabularySituation" component={SituationDetailScreen} />
      <VocabularyStack.Screen name="VocabularyPractice" component={PracticeScreen} />
      <VocabularyStack.Screen name="VocabularyResult" component={PracticeResultScreen} />
    </VocabularyStack.Navigator>
  );
}
