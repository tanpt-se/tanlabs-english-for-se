import { useNavigation } from '@react-navigation/native';

import type { MainTabParamList } from '@/app/navigation/types';
import type { BottomNavDestination } from '@/components/ui/navigation';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export function useMainTabSelect() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const flags = useFeatureFlags();

  return (destination: BottomNavDestination) => {
    switch (destination) {
      case 'home':
        navigation.navigate('Home');
        return;
      case 'profile':
        navigation.navigate('Profile');
        return;
      case 'vocabulary':
        if (flags.data?.vocabulary === true) {
          navigation.navigate('Vocabulary', { screen: 'VocabularyHome' });
        }
        return;
      case 'grammar':
        if (flags.data?.grammar === true) {
          navigation.navigate('Grammar', { screen: 'GrammarHome' });
        }
        return;
      case 'interview':
        if (flags.data?.interview === true) {
          navigation.navigate('Interview');
        }
        return;
      default:
        return;
    }
  };
}
