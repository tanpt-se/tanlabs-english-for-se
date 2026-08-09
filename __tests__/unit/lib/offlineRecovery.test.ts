import { QueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { resumePausedMutationsWithRecovery } from '@/lib/offlineRecovery';
import { queryPersistenceOptions } from '@/lib/queryClient';

describe('offline recovery helpers', () => {
  it('surfaces recovery UI when resumed mutations reject', async () => {
    const client = new QueryClient();
    const notify = jest.fn();
    jest.spyOn(client, 'resumePausedMutations').mockRejectedValueOnce(new Error('resume failed'));

    await resumePausedMutationsWithRecovery(client, notify);

    expect(notify).toHaveBeenCalledWith('Sync delayed', 'resume failed');
  });

  it('uses a generic message when resume rejects a non-Error', async () => {
    const client = new QueryClient();
    const notify = jest.fn();
    jest.spyOn(client, 'resumePausedMutations').mockRejectedValueOnce('offline');

    await resumePausedMutationsWithRecovery(client, notify);

    expect(notify).toHaveBeenCalledWith(
      'Sync delayed',
      'Some changes could not sync. Retry when you are back online.',
    );
  });

  it('falls back to Alert.alert when no notify override is provided', async () => {
    const client = new QueryClient();
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(client, 'resumePausedMutations').mockRejectedValueOnce(new Error('network'));

    await resumePausedMutationsWithRecovery(client);

    expect(alert).toHaveBeenCalledWith('Sync delayed', 'network');
  });

  it('keeps silence when resumed mutations settle', async () => {
    const client = new QueryClient();
    const notify = jest.fn();
    jest.spyOn(client, 'resumePausedMutations').mockResolvedValueOnce([] as never);

    await resumePausedMutationsWithRecovery(client, notify);

    expect(notify).not.toHaveBeenCalled();
  });

  it('does not add a full offline conflict-sync layer', () => {
    expect(
      queryPersistenceOptions.dehydrateOptions.shouldDehydrateQuery({
        queryKey: ['remote-config'],
      }),
    ).toBe(true);
    expect(
      queryPersistenceOptions.dehydrateOptions.shouldDehydrateQuery({
        queryKey: ['notification-settings', 'user-1'],
      }),
    ).toBe(false);
    expect(Alert.alert).toEqual(expect.any(Function));
  });
});
