import { QueryClient } from '@tanstack/react-query';

import { deactivateCurrentDevice } from '@/core/notification/deviceService';
import {
  configureNotificationMutationDefaults,
  notificationSettingsMutationKey,
  type NotificationSettingsMutationContext,
  type NotificationSettingsMutationInput,
  updateNotificationSettings,
} from '@/core/notification/mutations';
import { setNotificationEnabled } from '@/core/notification/settingsService';

jest.mock('@/core/notification/settingsService', () => ({
  setNotificationEnabled: jest.fn(async (_userId: string, enabled: boolean) => ({
    enabled,
    updated_at: '2026-08-09T00:00:00.000Z',
    user_id: 'user-1',
  })),
}));

jest.mock('@/core/notification/deviceService', () => ({
  deactivateCurrentDevice: jest.fn(async () => undefined),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

test('registers a resumable online notification mutation', () => {
  const client = new QueryClient();

  configureNotificationMutationDefaults(client);

  expect(client.getMutationDefaults(notificationSettingsMutationKey)).toMatchObject({
    mutationFn: updateNotificationSettings,
    networkMode: 'online',
    onError: expect.any(Function),
    onSettled: expect.any(Function),
    onSuccess: expect.any(Function),
  });
});

test('restored notification mutation rolls optimistic state back on failure', () => {
  const client = new QueryClient();
  const input: NotificationSettingsMutationInput = { enabled: true, userId: 'user-1' };
  const queryKey = ['notification-settings', input.userId] as const;
  const previous = { enabled: false, user_id: input.userId };
  const context: NotificationSettingsMutationContext = { previous, queryKey };

  configureNotificationMutationDefaults(client);
  client.setQueryData(queryKey, { enabled: true, user_id: input.userId });

  const defaults = client.getMutationDefaults(notificationSettingsMutationKey);
  const onError = defaults.onError as unknown as (
    error: Error,
    variables: NotificationSettingsMutationInput,
    mutationContext: NotificationSettingsMutationContext,
  ) => void;
  onError(new Error('request failed'), input, context);

  expect(client.getQueryData(queryKey)).toEqual(previous);
  client.clear();
});

test('disabling notifications deactivates the current device', async () => {
  jest.clearAllMocks();
  await updateNotificationSettings({ enabled: false, userId: 'user-1' });

  expect(setNotificationEnabled).toHaveBeenCalledWith('user-1', false);
  expect(deactivateCurrentDevice).toHaveBeenCalled();
});

test('enabling notifications does not deactivate the device', async () => {
  jest.clearAllMocks();
  await updateNotificationSettings({ enabled: true, userId: 'user-1' });

  expect(setNotificationEnabled).toHaveBeenCalledWith('user-1', true);
  expect(deactivateCurrentDevice).not.toHaveBeenCalled();
});
