export function normalizeFillBlank(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeOrderTokenText(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/\u2019/g, "'")
    .replace(/[.?!]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
