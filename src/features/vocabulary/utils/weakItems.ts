export type WeakProgressRow = {
  itemId: string;
  lastResult: boolean | null;
  incorrectCount: number;
  correctCount: number;
  lastSeenAt: string | null;
  sortOrder: number;
};

/** Frozen PH3-01 predicate: last_result = false OR incorrect_count > correct_count. */
export function isWeakItem(row: WeakProgressRow): boolean {
  if (row.lastResult === false) {
    return true;
  }
  return row.incorrectCount > row.correctCount;
}

/** Frozen order: oldest last_seen_at, then sort_order, then itemId. */
export function sortWeakItems<T extends WeakProgressRow>(rows: T[]): T[] {
  return [...rows].filter(isWeakItem).sort((a, b) => {
    const aSeen = a.lastSeenAt ?? '';
    const bSeen = b.lastSeenAt ?? '';
    if (aSeen !== bSeen) {
      if (!aSeen) return -1;
      if (!bSeen) return 1;
      return aSeen.localeCompare(bSeen);
    }
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.itemId.localeCompare(b.itemId);
  });
}
