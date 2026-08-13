import {
  clearPersistedQueryCache,
  queryClient,
  queryPersistenceOptions,
  queryPersister,
} from '@/lib/queryClient';

describe('queryClient persistence helpers', () => {
  it('dehydrates only remote-config queries', () => {
    const shouldDehydrateQuery = queryPersistenceOptions.dehydrateOptions.shouldDehydrateQuery;
    expect(shouldDehydrateQuery({ queryKey: ['remote-config'] })).toBe(true);
    expect(shouldDehydrateQuery({ queryKey: ['grammar', 'topics'] })).toBe(false);
  });

  it('dehydrates only paused grammar/notification mutations', () => {
    const shouldDehydrateMutation =
      queryPersistenceOptions.dehydrateOptions.shouldDehydrateMutation;

    expect(
      shouldDehydrateMutation({
        state: { isPaused: true },
        options: { mutationKey: ['grammar-complete-attempt'] },
      }),
    ).toBe(true);
    expect(
      shouldDehydrateMutation({
        state: { isPaused: true },
        options: { mutationKey: ['notification-settings-update'] },
      }),
    ).toBe(true);
    expect(
      shouldDehydrateMutation({
        state: { isPaused: false },
        options: { mutationKey: ['grammar-complete-attempt'] },
      }),
    ).toBe(false);
    expect(
      shouldDehydrateMutation({
        state: { isPaused: true },
        options: { mutationKey: ['other'] },
      }),
    ).toBe(false);
    expect(
      shouldDehydrateMutation({
        state: { isPaused: true },
        options: {},
      }),
    ).toBe(false);
  });

  it('clears the in-memory client and persisted cache', async () => {
    const clear = jest.spyOn(queryClient, 'clear');
    const removeClient = jest.spyOn(queryPersister, 'removeClient').mockResolvedValue(undefined);
    await clearPersistedQueryCache();
    expect(clear).toHaveBeenCalled();
    expect(removeClient).toHaveBeenCalled();
    clear.mockRestore();
    removeClient.mockRestore();
  });
});
