import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  NetworkProvider,
  shouldResumePausedMutations,
  useNetworkStatus,
} from '@/app/providers/NetworkProvider';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { configureNotificationMutationDefaults } from '@/core/notification/mutations';
import { configureGrammarMutationDefaults } from '@/features/grammar/mutations';
import { resumePausedMutationsWithRecovery } from '@/lib/offlineRecovery';
import { queryClient, queryPersistenceOptions } from '@/lib/queryClient';
import { navigationDarkTheme, navigationLightTheme } from '@/theme';

import type { PropsWithChildren } from 'react';

configureNotificationMutationDefaults(queryClient);
configureGrammarMutationDefaults(queryClient);

function PersistedAppProviders({ children }: PropsWithChildren) {
  const { isConnectionKnown, isOnline } = useNetworkStatus();
  const [cacheRestored, setCacheRestored] = useState(false);
  const colorScheme = useColorScheme();
  const navigationTheme = colorScheme === 'dark' ? navigationDarkTheme : navigationLightTheme;

  useEffect(() => {
    if (!shouldResumePausedMutations(cacheRestored, isConnectionKnown, isOnline)) {
      return;
    }
    resumePausedMutationsWithRecovery(queryClient).then(
      () => undefined,
      () => undefined,
    );
  }, [cacheRestored, isConnectionKnown, isOnline]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={queryPersistenceOptions}
      onSuccess={() => setCacheRestored(true)}
    >
      <AuthProvider>
        <NavigationContainer theme={navigationTheme}>{children}</NavigationContainer>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <NetworkProvider>
          <PersistedAppProviders>{children}</PersistedAppProviders>
        </NetworkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
