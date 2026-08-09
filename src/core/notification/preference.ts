export function isNotificationPreferenceEnabled(
  settings: { enabled: boolean } | null | undefined,
): boolean {
  return Boolean(settings?.enabled);
}

export function mergeNotificationPreference(input: {
  serverEnabled: boolean;
  localEnabled: boolean;
}): { enabled: boolean; dirty: boolean } {
  return {
    enabled: input.localEnabled,
    dirty: input.localEnabled !== input.serverEnabled,
  };
}
