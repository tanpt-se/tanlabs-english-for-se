import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { VocabularyPracticeStackParamList } from '@/app/navigation/types';
import { PracticeResultScreen } from '@/features/vocabulary/screens/PracticeResultScreen';
import { PracticeScreen } from '@/features/vocabulary/screens/PracticeScreen';
import { ReviewScreen } from '@/features/vocabulary/screens/ReviewScreen';
import { PracticeSessionProvider } from '@/features/vocabulary/session';

const PracticeStack = createNativeStackNavigator<VocabularyPracticeStackParamList>();

export function VocabularyPracticeFlowNavigator() {
  return (
    <PracticeSessionProvider>
      <PracticeStack.Navigator screenOptions={{ headerShown: false }}>
        <PracticeStack.Screen name="VocabularyPractice" component={PracticeScreen} />
        <PracticeStack.Screen name="VocabularyReview" component={ReviewScreen} />
        <PracticeStack.Screen name="VocabularyResult" component={PracticeResultScreen} />
      </PracticeStack.Navigator>
    </PracticeSessionProvider>
  );
}
