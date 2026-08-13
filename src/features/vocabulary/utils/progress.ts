/**
 * Count known vocabulary item IDs belonging to a situation.
 * Item IDs are `${situationId}:${itemKey}`.
 */
export function countKnownInSituation(situationId: string, knownIds: ReadonlySet<string>): number {
  const prefix = `${situationId}:`;
  let count = 0;
  for (const id of knownIds) {
    if (id.startsWith(prefix)) {
      count += 1;
    }
  }
  return count;
}
