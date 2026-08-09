import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: CACHE_MAX_AGE,
      networkMode: 'online',
      staleTime: 60_000,
      retry: 1,
    },
    mutations: {
      networkMode: 'online',
      retry: 3,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'tanlabs-english-query-cache',
});

export const queryPersistenceOptions = {
  persister: queryPersister,
  maxAge: CACHE_MAX_AGE,
  buster: 'security-v2',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) =>
      query.queryKey[0] === 'remote-config',
  },
};

export async function clearPersistedQueryCache(): Promise<void> {
  queryClient.clear();
  await queryPersister.removeClient();
}
