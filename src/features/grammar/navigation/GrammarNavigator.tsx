import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';

import type { GrammarStackParamList } from '@/app/navigation/types';
import {
  clearGrammarMonitoringContext,
  setGrammarMonitoringContext,
} from '@/core/monitoring/crashlytics';
import { GrammarPracticeFlowNavigator } from '@/features/grammar/navigation/GrammarPracticeFlowNavigator';
import { GrammarHomeScreen } from '@/features/grammar/screens/GrammarHomeScreen';
import { GrammarLessonScreen } from '@/features/grammar/screens/GrammarLessonScreen';
import { GrammarTopicScreen } from '@/features/grammar/screens/GrammarTopicScreen';

const GrammarStack = createNativeStackNavigator<GrammarStackParamList>();

export function GrammarNavigator() {
  useEffect(() => {
    setGrammarMonitoringContext({ route: 'GrammarHome' }).catch(() => undefined);
    return () => {
      clearGrammarMonitoringContext().catch(() => undefined);
    };
  }, []);

  return (
    <GrammarStack.Navigator
      screenOptions={{ headerShown: false }}
      screenListeners={{
        state: (event) => {
          const routeName = event.data.state?.routes[event.data.state.index ?? 0]?.name;
          if (typeof routeName === 'string') {
            setGrammarMonitoringContext({ route: routeName }).catch(() => undefined);
          }
        },
      }}
    >
      <GrammarStack.Screen name="GrammarHome" component={GrammarHomeScreen} />
      <GrammarStack.Screen name="GrammarTopic" component={GrammarTopicScreen} />
      <GrammarStack.Screen name="GrammarLesson" component={GrammarLessonScreen} />
      <GrammarStack.Screen name="GrammarPracticeFlow" component={GrammarPracticeFlowNavigator} />
    </GrammarStack.Navigator>
  );
}
