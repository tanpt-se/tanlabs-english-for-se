/**
 * Cambridge-style short part-of-speech tags for vocabulary rows.
 * Prefer authored `pos` on pack items; otherwise infer from type + term shape.
 */

export type VocabularyPos = 'n' | 'v' | 'adj' | 'adv' | 'phr' | 'phr v' | 'expr' | 'prep' | 'n phr';

export type VocabularyPosMeta = {
  code: VocabularyPos;
  /** Short badge text, e.g. `(n)`. */
  label: string;
  /** Accessible long name. */
  name: string;
};

const POS_META: Record<VocabularyPos, Omit<VocabularyPosMeta, 'code'>> = {
  n: { label: '(n)', name: 'noun' },
  v: { label: '(v)', name: 'verb' },
  adj: { label: '(adj)', name: 'adjective' },
  adv: { label: '(adv)', name: 'adverb' },
  phr: { label: '(phr)', name: 'phrase' },
  'phr v': { label: '(phr v)', name: 'phrasal verb' },
  expr: { label: '(expr)', name: 'expression' },
  prep: { label: '(prep)', name: 'preposition' },
  'n phr': { label: '(n phr)', name: 'noun phrase' },
};

/** Fixed badge colors (readable on light + dark soft surfaces). */
export const POS_BADGE_COLORS: Record<VocabularyPos, { bg: string; text: string }> = {
  n: { bg: '#E6F5ED', text: '#2E7D55' },
  v: { bg: '#E8EEF8', text: '#1E3A7A' },
  adj: { bg: '#FFF4E0', text: '#9A6B12' },
  adv: { bg: '#FDECEC', text: '#9F2F2F' },
  phr: { bg: '#F0E8FA', text: '#5B3A8C' },
  'phr v': { bg: '#E8F4FB', text: '#1A5F7A' },
  expr: { bg: '#F5F6FA', text: '#5C667A' },
  prep: { bg: '#FFF0E8', text: '#A85A2A' },
  'n phr': { bg: '#E6F5ED', text: '#2E7D55' },
};

const COMMON_VERBS = new Set(
  [
    'assign',
    'block',
    'clarify',
    'debug',
    'deploy',
    'escalate',
    'estimate',
    'fix',
    'follow',
    'merge',
    'mitigate',
    'monitor',
    'own',
    'prioritize',
    'rebase',
    'refactor',
    'reproduce',
    'revert',
    'rollback',
    'ship',
    'sync',
    'triage',
    'unblock',
    'verify',
  ].map((w) => w.toLowerCase()),
);

const COMMON_ADJECTIVES = new Set(
  [
    'blocked',
    'broken',
    'critical',
    'ready',
    'stable',
    'stale',
    'urgent',
    'flaky',
    'offline',
    'online',
  ].map((w) => w.toLowerCase()),
);

const PHRASAL_VERB_STARTERS =
  /^(catch|check|follow|get|give|look|put|roll|run|set|sign|take|turn|bring|come|go|break|call|fill|hand|pick|scale|ship|stand|wrap)\s+/i;

export function getPosMeta(pos: VocabularyPos): VocabularyPosMeta {
  return { code: pos, ...POS_META[pos] };
}

export function normalizePos(raw: unknown): VocabularyPos | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const key = raw.trim().toLowerCase() as VocabularyPos;
  return key in POS_META ? key : null;
}

/**
 * Infer a Cambridge-style POS when authoring omitted `pos`.
 * Workplace SE lemmas skew noun-heavy; phrases/expressions map by type.
 */
export function inferPos(
  type: 'word' | 'phrase' | 'expression' | string,
  term: string,
): VocabularyPos {
  if (type === 'expression') {
    return 'expr';
  }
  if (type === 'phrase') {
    if (PHRASAL_VERB_STARTERS.test(term)) {
      return 'phr v';
    }
    return 'phr';
  }

  const lemma = term.trim().toLowerCase();
  if (COMMON_ADJECTIVES.has(lemma)) {
    return 'adj';
  }
  if (COMMON_VERBS.has(lemma) || /^(re|un|de)[a-z]{3,}$/i.test(lemma)) {
    return 'v';
  }
  if (/ly$/i.test(lemma) && lemma.length > 4) {
    return 'adv';
  }
  if (/^(on|at|in|for|to|with|by|from)\b/i.test(lemma)) {
    return 'prep';
  }
  return 'n';
}

export function resolvePos(
  type: 'word' | 'phrase' | 'expression' | string,
  term: string,
  authoredPos?: unknown,
): VocabularyPos {
  return normalizePos(authoredPos) ?? inferPos(type, term);
}
