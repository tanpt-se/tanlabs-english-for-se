/**
 * Deterministic string normalization for fill-blank grading (PH2-03).
 * No locale/fuzzy scoring.
 */
export function normalizeFillBlank(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Strip documented trailing punctuation from sentence-order tokens. */
export function normalizeOrderTokenText(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/\u2019/g, "'")
    .replace(/[.?!]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
