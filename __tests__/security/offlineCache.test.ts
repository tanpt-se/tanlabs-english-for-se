import { queryPersistenceOptions } from '@/lib/queryClient';

test('persists only public remote configuration queries', () => {
  const shouldPersist = queryPersistenceOptions.dehydrateOptions.shouldDehydrateQuery;

  expect(queryPersistenceOptions.buster).toBe('security-v2');
  expect(shouldPersist({ queryKey: ['remote-config', 'feature-flags'] })).toBe(true);
  expect(shouldPersist({ queryKey: ['profile', 'user-1'] })).toBe(false);
  expect(shouldPersist({ queryKey: ['notification-settings', 'user-1'] })).toBe(false);
});
