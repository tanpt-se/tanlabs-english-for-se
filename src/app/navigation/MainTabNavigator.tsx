import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import { learningDisabledDestinations } from '@/app/navigation/learningDisabledDestinations';
import type { MainTabParamList } from '@/app/navigation/types';
import { BottomNavigation, type BottomNavDestination } from '@/components/ui/navigation';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { GrammarNavigator } from '@/features/grammar/navigation/GrammarNavigator';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { InterviewHomeScreen } from '@/features/interview/screens/InterviewHomeScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { VocabularyNavigator } from '@/features/vocabulary/navigation/VocabularyNavigator';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_TO_DESTINATION: Record<keyof MainTabParamList, BottomNavDestination> = {
  Grammar: 'grammar',
  Home: 'home',
  Interview: 'interview',
  Profile: 'profile',
  Vocabulary: 'vocabulary',
};

const DESTINATION_TO_TAB: Record<BottomNavDestination, keyof MainTabParamList> = {
  grammar: 'Grammar',
  home: 'Home',
  interview: 'Interview',
  profile: 'Profile',
  vocabulary: 'Vocabulary',
};

function grammarShowsTabBar(route: RouteProp<MainTabParamList, 'Grammar'>): boolean {
  const focused = getFocusedRouteNameFromRoute(route) ?? 'GrammarHome';
  return focused === 'GrammarHome';
}

function vocabularyShowsTabBar(route: RouteProp<MainTabParamList, 'Vocabulary'>): boolean {
  const focused = getFocusedRouteNameFromRoute(route) ?? 'VocabularyHome';
  return focused === 'VocabularyHome';
}

function shouldShowTabBar(props: BottomTabBarProps): boolean {
  const route = props.state.routes[props.state.index];
  if (route.name === 'Grammar') {
    return grammarShowsTabBar(route as RouteProp<MainTabParamList, 'Grammar'>);
  }
  if (route.name === 'Vocabulary') {
    return vocabularyShowsTabBar(route as RouteProp<MainTabParamList, 'Vocabulary'>);
  }
  return true;
}

function AppTabBar(props: BottomTabBarProps) {
  const flags = useFeatureFlags();
  if (!shouldShowTabBar(props)) {
    return null;
  }

  const route = props.state.routes[props.state.index];
  const active = TAB_TO_DESTINATION[route.name as keyof MainTabParamList];
  const disabled = learningDisabledDestinations(flags.data);

  return (
    <BottomNavigation
      active={active}
      disabledDestinations={disabled}
      onSelect={(destination) => {
        if (disabled.includes(destination)) {
          return;
        }
        const tab = DESTINATION_TO_TAB[destination];
        if (destination === 'grammar') {
          props.navigation.navigate('Grammar', { screen: 'GrammarHome' });
          return;
        }
        if (destination === 'vocabulary') {
          props.navigation.navigate('Vocabulary', { screen: 'VocabularyHome' });
          return;
        }
        props.navigation.navigate(tab);
      }}
    />
  );
}

function renderAppTabBar(props: BottomTabBarProps) {
  return <AppTabBar {...props} />;
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
      tabBar={renderAppTabBar}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Grammar" component={GrammarNavigator} />
      <Tab.Screen name="Vocabulary" component={VocabularyNavigator} />
      <Tab.Screen name="Interview" component={InterviewHomeScreen} />
      <Tab.Screen name="Profile" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
