import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Alert } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import {
  getNotificationPermissionGranted,
  requestNotificationPermissionWithRationale,
} from '@/core/notification/fcm';
import { updateNotificationSettings } from '@/core/notification/mutations';
import { fetchNotificationSettings } from '@/core/notification/settingsService';
import { fetchProfile } from '@/core/profile/service';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useNotificationSettings } from '@/features/settings/hooks/useNotificationSettings';

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/core/profile/service', () => ({
  fetchProfile: jest.fn(),
}));

jest.mock('@/core/notification/settingsService', () => ({
  fetchNotificationSettings: jest.fn(),
}));

jest.mock('@/core/notification/mutations', () => ({
  notificationSettingsMutationKey: ['notification-settings'],
  updateNotificationSettings: jest.fn(),
}));

jest.mock('@/core/notification/fcm', () => ({
  getNotificationPermissionGranted: jest.fn(async () => true),
  requestNotificationPermissionWithRationale: jest.fn(async () => true),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

type HookApi = ReturnType<typeof useNotificationSettings>;
type ProfileApi = ReturnType<typeof useProfile>;

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity, retry: false },
    },
  });
}

async function waitFor(predicate: () => boolean, label: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (predicate()) {
      return;
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function preferenceCalls() {
  return jest
    .mocked(updateNotificationSettings)
    .mock.calls.map((call) => call[0])
    .filter((input): input is { enabled: boolean; userId: string } =>
      Boolean(input && typeof input === 'object' && 'userId' in input),
    );
}

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the signed-in profile', async () => {
    jest.mocked(useAuth).mockReturnValue({ user: { id: 'user-1' } } as never);
    jest.mocked(fetchProfile).mockResolvedValue({
      id: 'user-1',
      display_name: 'Ada',
      english_level: 'B2',
      created_at: '',
      updated_at: '',
    });

    let api: ProfileApi | undefined;
    function Probe() {
      api = useProfile();
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={createClient()}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    await waitFor(() => api?.isSuccess === true, 'profile success');
    expect(fetchProfile).toHaveBeenCalledWith('user-1');
    expect(api?.data?.display_name).toBe('Ada');
    act(() => {
      root.unmount();
    });
  });

  it('does not fetch when signed out', async () => {
    jest.mocked(useAuth).mockReturnValue({ user: null } as never);
    let api: ProfileApi | undefined;
    function Probe() {
      api = useProfile();
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={createClient()}>
          <Probe />
        </QueryClientProvider>,
      );
    });

    expect(api?.fetchStatus).toBe('idle');
    expect(fetchProfile).not.toHaveBeenCalled();
    act(() => {
      root.unmount();
    });
  });
});

describe('useNotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({ user: { id: 'user-1' } } as never);
    jest.mocked(fetchNotificationSettings).mockResolvedValue({
      enabled: false,
      updated_at: '2026-08-09T00:00:00.000Z',
      user_id: 'user-1',
    });
    jest.mocked(getNotificationPermissionGranted).mockResolvedValue(true);
    jest.mocked(requestNotificationPermissionWithRationale).mockResolvedValue(true);
    jest.mocked(updateNotificationSettings).mockImplementation(async (input) => ({
      enabled: input.enabled,
      updated_at: '2026-08-09T00:00:00.000Z',
      user_id: input.userId,
    }));
  });

  async function mount(): Promise<{ api: () => HookApi; unmount: () => void }> {
    let api!: HookApi;
    function Probe() {
      api = useNotificationSettings();
      return null;
    }
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(
        <QueryClientProvider client={createClient()}>
          <Probe />
        </QueryClientProvider>,
      );
    });
    return {
      api: () => api,
      unmount: () => {
        act(() => {
          root.unmount();
        });
      },
    };
  }

  it('loads preference and OS permission for the signed-in user', async () => {
    const { api, unmount } = await mount();
    await waitFor(() => api().data?.user_id === 'user-1', 'notification settings data');
    expect(fetchNotificationSettings).toHaveBeenCalledWith('user-1');
    expect(api().preferenceEnabled).toBe(false);
    expect(api().osGranted).toBe(true);
    unmount();
  });

  it('alerts when enabling without a session', async () => {
    jest.mocked(useAuth).mockReturnValue({ user: null } as never);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { api, unmount } = await mount();

    await act(async () => {
      api().setEnabled(true);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(alert).toHaveBeenCalledWith('Notifications', 'Missing session.');
    expect(preferenceCalls()).toHaveLength(0);
    unmount();
  });

  it('persists enabled=true after OS permission is granted', async () => {
    const { api, unmount } = await mount();
    await waitFor(() => api().data !== undefined, 'initial settings');

    await act(async () => {
      api().setEnabled(true);
    });
    await waitFor(() => preferenceCalls().length > 0, 'persist enabled');

    expect(requestNotificationPermissionWithRationale).toHaveBeenCalled();
    expect(preferenceCalls()).toContainEqual({ enabled: true, userId: 'user-1' });
    await waitFor(() => api().isUpdating === false, 'permission busy cleared');
    expect(trackEvent).toHaveBeenCalledWith('notification_enabled');
    unmount();
  });

  it('stores preference off when OS permission is denied', async () => {
    jest.mocked(requestNotificationPermissionWithRationale).mockResolvedValue(false);
    const { api, unmount } = await mount();
    await waitFor(() => api().data !== undefined, 'initial settings');

    await act(async () => {
      api().setEnabled(true);
    });
    await waitFor(() => preferenceCalls().length > 0, 'persist disabled');

    expect(preferenceCalls()).toContainEqual({ enabled: false, userId: 'user-1' });
    await waitFor(() => api().isUpdating === false, 'permission busy cleared');
    unmount();
  });

  it('disables preference and surfaces mutation failures', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.mocked(updateNotificationSettings).mockRejectedValueOnce(new Error('save failed'));
    const { api, unmount } = await mount();
    await waitFor(() => api().data !== undefined, 'initial settings');

    await act(async () => {
      api().setEnabled(false);
    });
    await waitFor(() => alert.mock.calls.length > 0, 'error alert');

    expect(alert).toHaveBeenCalledWith('Notifications', 'save failed');
    unmount();
  });

  it('alerts when enable permission request throws', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest
      .mocked(requestNotificationPermissionWithRationale)
      .mockRejectedValueOnce(new Error('prompt failed'));
    const { api, unmount } = await mount();
    await waitFor(() => api().data !== undefined, 'initial settings');

    await act(async () => {
      api().setEnabled(true);
    });
    await waitFor(() => alert.mock.calls.length > 0, 'enable error alert');

    expect(alert).toHaveBeenCalledWith('Notifications', 'prompt failed');
    await waitFor(() => preferenceCalls().some((call) => call.enabled === false), 'rollback off');
    await waitFor(() => api().isUpdating === false, 'permission busy cleared');
    unmount();
  });
});
