import { Alert } from 'react-native';

import type { QueryClient } from '@tanstack/react-query';

/**
 * Resume paused online mutations after cache restore + connectivity.
 * Promise rejection surfaces recovery UI (mutation `onError` still rolls back optimistic state).
 */
export async function resumePausedMutationsWithRecovery(
  client: QueryClient,
  notify: (title: string, message: string) => void = Alert.alert,
): Promise<void> {
  try {
    await client.resumePausedMutations();
  } catch (error) {
    notify(
      'Sync delayed',
      error instanceof Error
        ? error.message
        : 'Some changes could not sync. Retry when you are back online.',
    );
  }
}
