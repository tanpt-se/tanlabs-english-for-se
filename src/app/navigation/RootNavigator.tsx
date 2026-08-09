import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';

import type { AppStackParamList, AuthStackParamList } from '@/app/navigation/types';
import { useAuth } from '@/core/auth/AuthProvider';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { CompleteProfileScreen } from '@/features/profile/screens/CompleteProfileScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const CompleteStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <AppStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit profile' }}
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

  useEffect(() => {
    if (bootstrapped) {
      BootSplash.hide({ fade: true }).catch(() => undefined);
    }
  }, [bootstrapped]);

  // Gate only initial account resolution — not every profile refresh.
  if (!bootstrapped || (session && !profileSettled)) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator />
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
