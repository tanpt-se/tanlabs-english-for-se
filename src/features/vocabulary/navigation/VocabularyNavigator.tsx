import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { VocabularyStackParamList } from '@/app/navigation/types';
import { VocabularyPracticeFlowNavigator } from '@/features/vocabulary/navigation/VocabularyPracticeFlowNavigator';
import { SituationDetailScreen } from '@/features/vocabulary/screens/SituationDetailScreen';
import { TermDetailScreen } from '@/features/vocabulary/screens/TermDetailScreen';
import { VocabularyHomeScreen } from '@/features/vocabulary/screens/VocabularyHomeScreen';
import { WeakItemsScreen } from '@/features/vocabulary/screens/WeakItemsScreen';

const VocabularyStack = createNativeStackNavigator<VocabularyStackParamList>();

export function VocabularyNavigator() {
  return (
    <VocabularyStack.Navigator screenOptions={{ headerShown: false }}>
      <VocabularyStack.Screen name="VocabularyHome" component={VocabularyHomeScreen} />
      <VocabularyStack.Screen name="VocabularySituation" component={SituationDetailScreen} />
      <VocabularyStack.Screen name="VocabularyTerm" component={TermDetailScreen} />
      <VocabularyStack.Screen name="VocabularyWeak" component={WeakItemsScreen} />
      <VocabularyStack.Screen
        name="VocabularyPracticeFlow"
        component={VocabularyPracticeFlowNavigator}
      />
    </VocabularyStack.Navigator>
  );
}
