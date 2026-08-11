import { useNavigation } from '@react-navigation/native';

import type { AppStackParamList } from '@/app/navigation/types';
import type { BottomNavDestination } from '@/components/ui/navigation';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/** Shared main-tab routing for Home / Profile / flag-gated learning tabs. */
export function useMainTabSelect() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const flags = useFeatureFlags();

  return (destination: BottomNavDestination) => {
    switch (destination) {
      case 'home':
        navigation.navigate('Home');
        return;
      case 'profile':
        navigation.navigate('Settings');
        return;
      case 'vocabulary':
        if (flags.data?.vocabulary === true) {
          navigation.navigate('VocabularyHome');
        }
        return;
      case 'grammar':
        if (flags.data?.grammar === true) {
          navigation.navigate('Grammar', { screen: 'GrammarHome' });
        }
        return;
      case 'interview':
        return;
      default:
        return;
    }
  };
}
