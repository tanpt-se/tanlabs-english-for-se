import { trackEvent } from '@/core/analytics/events';
import { setNotificationEnabled } from '@/core/notification/settingsService';

import type { QueryClient } from '@tanstack/react-query';

export const notificationSettingsMutationKey = ['notification-settings-update'] as const;

export type NotificationSettingsMutationInput = {
  enabled: boolean;
  userId: string;
};

export type NotificationSettingsMutationContext = {
  previous: unknown;
  queryKey: readonly ['notification-settings', string];
};

export function updateNotificationSettings(input: NotificationSettingsMutationInput) {
  return setNotificationEnabled(input.userId, input.enabled);
}

export function configureNotificationMutationDefaults(client: QueryClient) {
  client.setMutationDefaults(notificationSettingsMutationKey, {
    mutationFn: updateNotificationSettings,
    networkMode: 'online',
    retry: 3,
    onSuccess: async (data) => {
      await trackEvent(data.enabled ? 'notification_enabled' : 'notification_disabled');
    },
    onError: (_error, _input, context) => {
      const rollback = context as NotificationSettingsMutationContext | undefined;
      if (rollback) {
        client.setQueryData(rollback.queryKey, rollback.previous);
      }
    },
    onSettled: async (_data, _error, input) => {
      await client.invalidateQueries({ queryKey: ['notification-settings', input.userId] });
      await client.invalidateQueries({ queryKey: ['notification-os-permission', input.userId] });
    },
  });
}
