import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { GrammarStackParamList } from '@/app/navigation/types';
import { GrammarHomeScreen } from '@/features/grammar/screens/GrammarHomeScreen';
import { GrammarLessonScreen } from '@/features/grammar/screens/GrammarLessonScreen';
import { GrammarPracticeScreen } from '@/features/grammar/screens/GrammarPracticeScreen';
import { GrammarResultScreen } from '@/features/grammar/screens/GrammarResultScreen';
import { GrammarTopicScreen } from '@/features/grammar/screens/GrammarTopicScreen';

const GrammarStack = createNativeStackNavigator<GrammarStackParamList>();

/**
 * Nested Grammar navigator. Mounting a future session provider wraps this root (PH2-08).
 * Routes always compile; Home applies fail-closed flag gating.
 */
export function GrammarNavigator() {
  return (
    <GrammarStack.Navigator screenOptions={{ headerShown: false }}>
      <GrammarStack.Screen name="GrammarHome" component={GrammarHomeScreen} />
      <GrammarStack.Screen name="GrammarTopic" component={GrammarTopicScreen} />
      <GrammarStack.Screen name="GrammarLesson" component={GrammarLessonScreen} />
      <GrammarStack.Screen name="GrammarPractice" component={GrammarPracticeScreen} />
      <GrammarStack.Screen name="GrammarResult" component={GrammarResultScreen} />
    </GrammarStack.Navigator>
  );
}
