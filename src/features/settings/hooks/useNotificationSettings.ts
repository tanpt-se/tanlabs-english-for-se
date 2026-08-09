import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import {
  getNotificationPermissionGranted,
  obtainAndPersistFcmToken,
  requestNotificationPermissionWithRationale,
} from '@/core/notification/fcm';
import {
  notificationSettingsMutationKey,
  updateNotificationSettings,
} from '@/core/notification/mutations';
import { fetchNotificationSettings } from '@/core/notification/settingsService';

export function useNotificationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const [permissionBusy, setPermissionBusy] = useState(false);

  const query = useQuery({
    queryKey: ['notification-settings', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return null;
      }
      return fetchNotificationSettings(userId);
    },
  });

  const osPermission = useQuery({
    queryKey: ['notification-os-permission', userId],
    enabled: Boolean(userId),
    queryFn: getNotificationPermissionGranted,
    staleTime: 15_000,
  });

  const mutation = useMutation({
    mutationKey: notificationSettingsMutationKey,
    networkMode: 'online',
    mutationFn: updateNotificationSettings,
    onMutate: async (input) => {
      const queryKey = ['notification-settings', input.userId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (current: typeof query.data) => ({
        enabled: input.enabled,
        updated_at: current?.updated_at ?? new Date().toISOString(),
        user_id: input.userId,
      }));
      return { previous, queryKey };
    },
    onSuccess: async (data) => {
      await trackEvent(data.enabled ? 'notification_enabled' : 'notification_disabled');
    },
    onError: (error, _input, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      Alert.alert(
        'Notifications',
        error instanceof Error ? error.message : 'Could not update notification preference.',
      );
    },
  });

  const persistEnabled = useCallback(
    (enabled: boolean) => {
      if (!userId) {
        Alert.alert('Notifications', 'Missing session.');
        return;
      }
      mutation.mutate({ enabled, userId });
    },
    [mutation, userId],
  );

  const setEnabled = useCallback(
    (enabled: boolean) => {
      if (!enabled) {
        persistEnabled(false);
        return;
      }

      setPermissionBusy(true);
      (async () => {
        try {
          const granted = await requestNotificationPermissionWithRationale();
          if (!granted) {
            persistEnabled(false);
            return;
          }
          persistEnabled(true);
          if (userId) {
            await Promise.race([
              obtainAndPersistFcmToken(userId),
              new Promise<null>((resolve) => {
                setTimeout(() => resolve(null), 8_000);
              }),
            ]);
          }
        } catch (error) {
          Alert.alert(
            'Notifications',
            error instanceof Error ? error.message : 'Could not enable notifications.',
          );
          persistEnabled(false);
        } finally {
          setPermissionBusy(false);
        }
      })().catch(() => {
        setPermissionBusy(false);
      });
    },
    [persistEnabled, userId],
  );

  const preferenceEnabled = Boolean(query.data?.enabled);
  const osGranted = osPermission.data !== false;
  // Switch follows stored preference so users can turn preference OFF even when OS is denied.
  // Delivery still requires both; Settings shows an OS-blocked hint when needed.

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    preferenceEnabled,
    osGranted,
    data: query.data
      ? {
          enabled: preferenceEnabled,
          preferenceEnabled,
          osGranted,
          updated_at: query.data.updated_at,
          user_id: query.data.user_id,
        }
      : undefined,
    setEnabled,
    isUpdating: mutation.isPending || permissionBusy,
  };
}
