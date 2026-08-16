/** Lower rank sorts first. Cores stay 1–10; library entries follow type + examples. */
export function libraryRank(item: {
  isCore?: boolean;
  coreOrder?: number | null;
  type: string;
  examples?: unknown[] | null;
  patterns?: unknown[] | null;
  sortOrder: number;
}): number {
  if (item.isCore === true) {
    return item.coreOrder ?? 0;
  }
  const typeBoost = item.type === 'expression' ? 0 : item.type === 'phrase' ? 1000 : 2000;
  const exampleBoost = Array.isArray(item.examples) && item.examples.length > 0 ? 0 : 400;
  const patternBoost = Array.isArray(item.patterns) && item.patterns.length > 0 ? 0 : 200;
  return (
    10000 + typeBoost + exampleBoost + patternBoost + Math.min(Math.max(0, item.sortOrder), 999)
  );
}
