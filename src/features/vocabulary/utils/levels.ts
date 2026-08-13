/** Cambridge CEFR bands used in Vocabulary packs (A2–C1). */
export const CEFR_LEVELS = ['A2', 'B1', 'B2', 'C1'] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export type LevelGroup<T> = {
  level: CefrLevel;
  items: T[];
  total: number;
};

/** Short Cambridge-style band labels for section headers. */
export const CEFR_LEVEL_LABELS: Record<CefrLevel, string> = {
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper intermediate',
  C1: 'Advanced',
};

export function isCefrLevel(value: string): value is CefrLevel {
  return (CEFR_LEVELS as readonly string[]).includes(value);
}

export function normalizeCefrLevel(raw: string | undefined): CefrLevel {
  if (raw && isCefrLevel(raw)) {
    return raw;
  }
  return 'A2';
}

/** Group list items by CEFR level (A2 → B1 → B2 → C1). Empty levels omitted. */
export function groupByCefrLevel<T extends { level: string }>(
  items: T[],
  levelTotals?: Partial<Record<CefrLevel, number>>,
): LevelGroup<T>[] {
  const buckets: Record<CefrLevel, T[]> = { A2: [], B1: [], B2: [], C1: [] };
  for (const item of items) {
    buckets[normalizeCefrLevel(item.level)].push(item);
  }
  return CEFR_LEVELS.filter((level) => buckets[level].length > 0).map((level) => ({
    level,
    items: buckets[level],
    total: levelTotals?.[level] ?? buckets[level].length,
  }));
}
