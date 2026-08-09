export type FeatureFlags = {
  grammar: boolean;
  vocabulary: boolean;
  interview: boolean;
  ai: boolean;
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  grammar: false,
  vocabulary: false,
  interview: false,
  ai: false,
};

const FLAG_KEYS = {
  grammar: 'feature_grammar',
  vocabulary: 'feature_vocabulary',
  interview: 'feature_interview',
  ai: 'feature_ai',
} as const;

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === 'false') {
    return value === 'true';
  }
  return null;
}

export function parseFeatureFlags(
  rows: Array<{ key: string; value: unknown }> | null | undefined,
): FeatureFlags {
  const next: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };

  if (!rows) {
    return next;
  }

  for (const [flag, key] of Object.entries(FLAG_KEYS) as Array<
    [keyof FeatureFlags, (typeof FLAG_KEYS)[keyof typeof FLAG_KEYS]]
  >) {
    const row = rows.find((item) => item.key === key);
    if (!row) {
      continue;
    }
    const parsed = coerceBoolean(row.value);
    if (parsed === null) {
      // Invalid remote value → keep default; caller may log.
      continue;
    }
    next[flag] = parsed;
  }

  return next;
}

export function listInvalidRemoteFlagKeys(
  rows: Array<{ key: string; value: unknown }> | null | undefined,
): string[] {
  if (!rows) {
    return [];
  }
  const watched = new Set(Object.values(FLAG_KEYS));
  return rows
    .filter((row) => watched.has(row.key as (typeof FLAG_KEYS)[keyof typeof FLAG_KEYS]))
    .filter((row) => coerceBoolean(row.value) === null)
    .map((row) => row.key);
}
