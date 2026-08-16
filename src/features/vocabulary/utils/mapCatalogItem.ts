import type {
  VocabularyCountability,
  VocabularyExpression,
  VocabularyTermDetail,
} from '@/features/vocabulary/types/catalog';
import { normalizeCefrLevel } from '@/features/vocabulary/utils/levels';
import { resolvePos } from '@/features/vocabulary/utils/pos';

export type CatalogItemRow = {
  id: string;
  item_key: string;
  type: string;
  term: string;
  meaning: string;
  context: string;
  level: string;
  pos: string | null;
  content: unknown;
  is_core?: boolean;
  core_order?: number | null;
  pronunciation?: string | null;
  countability?: string | null;
};

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function mapExamples(raw: unknown): Array<{ label: string; sentence: string }> {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((entry) => {
    if (Array.isArray(entry) && typeof entry[1] === 'string') {
      return [{ label: typeof entry[0] === 'string' ? entry[0] : '', sentence: entry[1] }];
    }
    if (entry && typeof entry === 'object' && 'sentence' in entry) {
      const row = entry as { label?: unknown; sentence?: unknown };
      if (typeof row.sentence === 'string') {
        return [
          {
            label: typeof row.label === 'string' ? row.label : '',
            sentence: row.sentence,
          },
        ];
      }
    }
    return [];
  });
}

function contentRecord(content: unknown): Record<string, unknown> {
  return content && typeof content === 'object' && !Array.isArray(content)
    ? (content as Record<string, unknown>)
    : {};
}

export function mapCatalogExpression(row: CatalogItemRow): VocabularyExpression {
  const level = normalizeCefrLevel(row.level);
  const type = row.type === 'word' || row.type === 'phrase' ? row.type : 'expression';
  const content = contentRecord(row.content);
  const countability = parseCountability(row.countability ?? content.countability);
  return {
    id: row.id,
    text: row.term,
    tag: `${type} · ${level}`,
    intent: row.meaning,
    needsPractice: type === 'expression' || row.is_core === true,
    level,
    pos: resolvePos(type, row.term, row.pos),
    context: row.context,
    isCore: row.is_core === true,
    coreOrder: typeof row.core_order === 'number' ? row.core_order : null,
    pronunciation:
      row.pronunciation ??
      (typeof content.pronunciation === 'string' ? content.pronunciation : null),
    countability,
  };
}

export function mapCatalogTerm(situationSlug: string, row: CatalogItemRow): VocabularyTermDetail {
  const content = contentRecord(row.content);
  const type = row.type === 'word' || row.type === 'phrase' ? row.type : 'expression';
  return {
    id: row.id,
    situationId: situationSlug,
    term: row.term,
    type,
    pos: resolvePos(
      type,
      row.term,
      row.pos ?? (typeof content.pos === 'string' ? content.pos : null),
    ),
    level: normalizeCefrLevel(row.level),
    meaning: row.meaning,
    context: row.context,
    patterns: asStringList(content.patterns),
    examples: mapExamples(content.examples),
    alternatives: asStringList(content.alternatives),
    notes: asStringList(content.notes),
    pronunciation:
      row.pronunciation ??
      (typeof content.pronunciation === 'string' ? content.pronunciation : null),
    countability: parseCountability(row.countability ?? content.countability),
  };
}

function parseCountability(value: unknown): VocabularyCountability | null {
  if (value === 'countable' || value === 'uncountable' || value === 'both' || value === 'na') {
    return value;
  }
  return null;
}
