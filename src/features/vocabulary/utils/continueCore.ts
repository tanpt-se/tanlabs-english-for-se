export function pickFirstUnlearnedCore<
  T extends { id: string; coreOrder?: number | null; situationSortOrder?: number },
>(items: readonly T[], knownIds: ReadonlySet<string>): T | null {
  const unknown = items.filter((item) => !knownIds.has(item.id));
  if (unknown.length === 0) {
    return null;
  }
  const sorted = [...unknown].sort((a, b) => {
    const situationDelta = (a.situationSortOrder ?? 0) - (b.situationSortOrder ?? 0);
    if (situationDelta !== 0) {
      return situationDelta;
    }
    return (a.coreOrder ?? 99) - (b.coreOrder ?? 99);
  });
  return sorted[0] ?? null;
}
