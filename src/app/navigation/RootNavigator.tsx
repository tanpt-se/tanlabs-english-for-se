import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';

import { MainTabNavigator } from '@/app/navigation/MainTabNavigator';
import type { AppStackParamList, AuthStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { useAuth } from '@/core/auth/AuthProvider';
import { ConfirmSignupScreen } from '@/features/auth/screens/ConfirmSignupScreen';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { SetNewPasswordScreen } from '@/features/auth/screens/SetNewPasswordScreen';
import { WelcomeScreen } from '@/features/auth/screens/WelcomeScreen';
import { CompleteProfileScreen } from '@/features/profile/screens/CompleteProfileScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { darkColors, lightColors } from '@/theme';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const CompleteStack = createNativeStackNavigator();
const SetPasswordStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ConfirmSignup" component={ConfirmSignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="MainTabs" component={MainTabNavigator} />
      <AppStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit profile', animation: 'slide_from_right' }}
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

function SetPasswordNavigator() {
  return (
    <SetPasswordStack.Navigator screenOptions={{ headerShown: false }}>
      <SetPasswordStack.Screen name="SetNewPassword" component={SetNewPasswordScreen} />
    </SetPasswordStack.Navigator>
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
        <BrandLoading
          color={isDark ? darkColors.primary : lightColors.primary}
          fill
          size="md"
          testID="app-boot-loading"
        />
      </View>
    );
  }

  if (destination === 'auth') {
    return <AuthNavigator />;
  }
  if (destination === 'setPassword') {
    return <SetPasswordNavigator />;
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
