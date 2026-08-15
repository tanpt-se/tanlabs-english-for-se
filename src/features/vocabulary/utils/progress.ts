/**
 * Count known vocabulary item IDs belonging to a situation.
 * Local packs use `${situationId}:${itemKey}`; remote items are UUIDs (pass `itemIds`).
 */
export function countKnownInSituation(
  situationId: string,
  knownIds: ReadonlySet<string>,
  itemIds?: readonly string[],
): number {
  if (itemIds) {
    let count = 0;
    for (const id of itemIds) {
      if (knownIds.has(id)) {
        count += 1;
      }
    }
    return count;
  }
  const prefix = `${situationId}:`;
  let count = 0;
  for (const id of knownIds) {
    if (id.startsWith(prefix)) {
      count += 1;
    }
  }
  return count;
}

export function formatProgress(learned: number, total: number): string {
  return `${learned} / ${total}`;
}
