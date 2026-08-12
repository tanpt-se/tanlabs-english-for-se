import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { GrammarPracticeStackParamList } from '@/app/navigation/types';
import { GrammarPracticeScreen } from '@/features/grammar/screens/GrammarPracticeScreen';
import { GrammarResultScreen } from '@/features/grammar/screens/GrammarResultScreen';
import { GrammarReviewScreen } from '@/features/grammar/screens/GrammarReviewScreen';
import { PracticeSessionProvider } from '@/features/grammar/session';

const PracticeStack = createNativeStackNavigator<GrammarPracticeStackParamList>();

export function GrammarPracticeFlowNavigator() {
  return (
    <PracticeSessionProvider>
      <PracticeStack.Navigator screenOptions={{ headerShown: false }}>
        <PracticeStack.Screen name="GrammarPractice" component={GrammarPracticeScreen} />
        <PracticeStack.Screen name="GrammarReview" component={GrammarReviewScreen} />
        <PracticeStack.Screen name="GrammarResult" component={GrammarResultScreen} />
      </PracticeStack.Navigator>
    </PracticeSessionProvider>
  );
}
