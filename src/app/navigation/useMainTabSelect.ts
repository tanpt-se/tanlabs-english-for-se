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
        if (flags.data?.vocabulary) {
          navigation.navigate('VocabularyHome');
        }
        return;
      case 'grammar':
      case 'interview':
        return;
      default:
        return;
    }
  };
}
