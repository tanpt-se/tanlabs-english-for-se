import {
  isNotificationPreferenceEnabled,
  mergeNotificationPreference,
} from '@/core/notification/preference';

describe('notification preference', () => {
  it('defaults to false', () => {
    expect(isNotificationPreferenceEnabled(null)).toBe(false);
  });

  it('merges local toggle with server value', () => {
    expect(mergeNotificationPreference({ serverEnabled: false, localEnabled: true })).toEqual({
      enabled: true,
      dirty: true,
    });
  });
});
