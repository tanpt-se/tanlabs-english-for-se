import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';

import type { AppStackParamList, AuthStackParamList } from '@/app/navigation/types';
import { useAuth } from '@/core/auth/AuthProvider';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { WelcomeScreen } from '@/features/auth/screens/WelcomeScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { CompleteProfileScreen } from '@/features/profile/screens/CompleteProfileScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { PracticeResultScreen } from '@/features/vocabulary/screens/PracticeResultScreen';
import { PracticeScreen } from '@/features/vocabulary/screens/PracticeScreen';
import { SituationDetailScreen } from '@/features/vocabulary/screens/SituationDetailScreen';
import { VocabularyHomeScreen } from '@/features/vocabulary/screens/VocabularyHomeScreen';
import { darkColors, lightColors } from '@/theme';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const CompleteStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <AppStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit profile' }}
      />
      {/* Always registered so remote-config fail-closed cannot unmount an active learning stack. */}
      <AppStack.Screen
        name="VocabularyHome"
        component={VocabularyHomeScreen}
        options={{ title: 'Vocabulary' }}
      />
      <AppStack.Screen
        name="VocabularySituation"
        component={SituationDetailScreen}
        options={{ title: 'Situation' }}
      />
      <AppStack.Screen
        name="VocabularyPractice"
        component={PracticeScreen}
        options={{ title: 'Practice' }}
      />
      <AppStack.Screen
        name="VocabularyResult"
        component={PracticeResultScreen}
        options={{ title: 'Result' }}
      />
    </AppStack.Navigator>
  );
}

function CompleteProfileNavigator() {
  return (
    <CompleteStack.Navigator screenOptions={{ headerShown: false }}>
      <CompleteStack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
    </CompleteStack.Navigator>
  );
}

export function RootNavigator() {
  const { bootstrapped, destination, profileSettled, session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (bootstrapped) {
      BootSplash.hide({ fade: true }).catch(() => undefined);
    }
  }, [bootstrapped]);

  // Gate only initial account resolution — not every profile refresh.
  if (!bootstrapped || (session && !profileSettled)) {
    return (
      <View
        style={[
          styles.boot,
          { backgroundColor: isDark ? darkColors.background : lightColors.background },
        ]}
      >
        <ActivityIndicator color={isDark ? darkColors.primary : lightColors.primary} />
      </View>
    );
  }

  if (destination === 'auth') {
    return <AuthNavigator />;
  }
  if (destination === 'completeProfile') {
    return <CompleteProfileNavigator />;
  }
  return <AppNavigator />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
