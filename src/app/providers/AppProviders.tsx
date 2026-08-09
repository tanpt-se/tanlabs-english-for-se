import { GluestackUIProvider } from '@gluestack-ui/themed';
import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NetworkProvider, useNetworkStatus } from '@/app/providers/NetworkProvider';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { configureNotificationMutationDefaults } from '@/core/notification/mutations';
import { queryClient, queryPersistenceOptions } from '@/lib/queryClient';
import { gluestackConfig } from '@/theme';

import type { PropsWithChildren } from 'react';

configureNotificationMutationDefaults(queryClient);

function PersistedAppProviders({ children }: PropsWithChildren) {
  const { isConnectionKnown, isOnline } = useNetworkStatus();
  const [cacheRestored, setCacheRestored] = useState(false);

  useEffect(() => {
    if (!cacheRestored || !isConnectionKnown || !isOnline) {
      return;
    }
    queryClient.resumePausedMutations().catch(() => undefined);
  }, [cacheRestored, isConnectionKnown, isOnline]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={queryPersistenceOptions}
      onSuccess={() => setCacheRestored(true)}
    >
      <AuthProvider>
        <NavigationContainer>{children}</NavigationContainer>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <GluestackUIProvider config={gluestackConfig}>
          <NetworkProvider>
            <PersistedAppProviders>{children}</PersistedAppProviders>
          </NetworkProvider>
        </GluestackUIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
