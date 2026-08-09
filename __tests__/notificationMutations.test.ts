import { QueryClient } from '@tanstack/react-query';

import {
  configureNotificationMutationDefaults,
  notificationSettingsMutationKey,
  updateNotificationSettings,
} from '@/core/notification/mutations';

test('registers a resumable online notification mutation', () => {
  const client = new QueryClient();

  configureNotificationMutationDefaults(client);

  expect(client.getMutationDefaults(notificationSettingsMutationKey)).toMatchObject({
    mutationFn: updateNotificationSettings,
    networkMode: 'online',
  });
});
