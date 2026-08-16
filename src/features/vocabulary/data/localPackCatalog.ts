import {
  VOCABULARY_PRACTICE_QUESTION_COUNT,
  VOCABULARY_PREVIEW_LIST_LIMIT,
} from '@/features/vocabulary/data/catalogConstants';
import type {
  VocabularyExpression,
  VocabularyTermDetail,
} from '@/features/vocabulary/types/catalog';
import type { VocabularyExercise } from '@/features/vocabulary/types/content';
import { buildCorePracticeExercises } from '@/features/vocabulary/utils/corePracticeExercises';
import { normalizeCefrLevel, type CefrLevel } from '@/features/vocabulary/utils/levels';
import { libraryRank } from '@/features/vocabulary/utils/libraryRank';
import { mapPackExercise } from '@/features/vocabulary/utils/mapPackExercise';
import { resolvePos } from '@/features/vocabulary/utils/pos';

import coreJson from '../../../../supabase/seed/vocabulary/core-expressions.json';
import packsJson from '../../../../supabase/seed/vocabulary/packs.json';

export type { VocabularyExpression, VocabularyTermDetail };
export { VOCABULARY_PRACTICE_QUESTION_COUNT, VOCABULARY_PREVIEW_LIST_LIMIT };

type VocabularySituation = {
  id: string;
  title: string;
  description: string;
  learned: number;
  total: number;
};

type PracticeQuestion = {
  id: string;
  itemId?: string;
  prompt: string;
  question: string;
  options: string[];
  correctIndex: number;
  insightTitle: string;
  insightBody: string;
};

type PackExercise = {
  key: string;
  type: 'choose_expression' | 'fill_blank' | 'sentence_order';
  prompt: string;
  payload: Record<string, unknown>;
  feedback?: {
    expression?: string;
    meaning?: string;
    context?: string;
    example?: string;
    explanation?: string;
  };
  sortOrder?: number;
};

type PackItem = {
  key: string;
  type: 'word' | 'phrase' | 'expression';
  term: string;
  meaning: string;
  context: string;
  level: string;
  sortOrder: number;
  pos?: string;
  patterns?: string[];
  examples?: [string, string][];
  alternatives?: string[];
  notes?: string[];
  exercises?: PackExercise[];
  isCore?: boolean;
  coreOrder?: number | null;
  pronunciation?: string | null;
  countability?: 'countable' | 'uncountable' | 'both' | 'na' | null;
};

type PackSituation = {
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
  items: PackItem[];
};

type PacksRoot = {
  contentSchemaVersion: number;
  situations: PackSituation[];
};

const packs = applyCoreOverlay(packsJson as unknown as PacksRoot, coreJson);

type CoreOverlay = {
  situations: Array<{
    slug: string;
    items: Array<{
      term: string;
      type: 'word' | 'phrase' | 'expression';
      meaning: string;
      context: string;
      level: string;
      pos?: string;
      coreOrder: number;
      pronunciation?: string;
      countability?: PackItem['countability'];
      patterns?: string[];
      examples?: [string, string][];
    }>;
  }>;
};

function applyCoreOverlay(root: PacksRoot, overlay: unknown): PacksRoot {
  const core = overlay as CoreOverlay;
  const situations = root.situations.map((situation) => {
    const overlayItems =
      core.situations.find((entry) => entry.slug === situation.slug)?.items ?? [];
    const byTerm = new Map(situation.items.map((item) => [item.term.trim().toLowerCase(), item]));
    const nextItems = [...situation.items];
    for (const overlayItem of overlayItems) {
      const existing = byTerm.get(overlayItem.term.trim().toLowerCase());
      if (existing) {
        existing.isCore = true;
        existing.coreOrder = overlayItem.coreOrder;
        existing.pronunciation = overlayItem.pronunciation ?? null;
        existing.countability = overlayItem.countability ?? 'na';
        existing.meaning = overlayItem.meaning;
        existing.sortOrder = overlayItem.coreOrder;
        if (overlayItem.patterns?.length) {
          existing.patterns = overlayItem.patterns;
        }
        if (overlayItem.examples?.length) {
          existing.examples = overlayItem.examples;
        }
        continue;
      }
      const key = `core-${overlayItem.term
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48)}`;
      nextItems.push({
        key,
        type: overlayItem.type,
        term: overlayItem.term,
        meaning: overlayItem.meaning,
        context: overlayItem.context,
        level: overlayItem.level,
        pos: overlayItem.pos,
        sortOrder: overlayItem.coreOrder,
        patterns: overlayItem.patterns ?? [],
        examples: overlayItem.examples ?? [],
        isCore: true,
        coreOrder: overlayItem.coreOrder,
        pronunciation: overlayItem.pronunciation ?? null,
        countability: overlayItem.countability ?? 'na',
        exercises: [],
      });
    }
    const coreTerms = overlayItems.map((item) => item.term);
    for (const item of nextItems) {
      if (!item.isCore || (item.exercises?.length ?? 0) > 0) {
        continue;
      }
      item.exercises = buildCorePracticeExercises(
        {
          key: item.key,
          term: item.term,
          meaning: item.meaning,
          context: item.context,
          examples: item.examples,
        },
        coreTerms,
      );
    }
    nextItems.sort((a, b) => {
      if (Boolean(a.isCore) !== Boolean(b.isCore)) {
        return a.isCore ? -1 : 1;
      }
      if (a.isCore && b.isCore) {
        return (a.coreOrder ?? 0) - (b.coreOrder ?? 0);
      }
      return libraryRank(a) - libraryRank(b);
    });
    return { ...situation, items: nextItems };
  });
  return { ...root, situations };
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
}

function mapExpression(situationSlug: string, item: PackItem): VocabularyExpression {
  const pos = resolvePos(item.type, item.term, item.pos);
  const level = normalizeCefrLevel(item.level);
  return {
    id: `${situationSlug}:${item.key}`,
    text: item.term,
    tag: `${item.type} · ${level}`,
    intent: item.meaning,
    needsPractice: item.type === 'expression' || item.isCore === true,
    level,
    pos,
    context: item.context,
    isCore: item.isCore === true,
    coreOrder: item.coreOrder ?? null,
    situationSlug,
    pronunciation: item.pronunciation ?? null,
    countability: item.countability ?? null,
  };
}

function mapTermDetail(situationSlug: string, item: PackItem): VocabularyTermDetail {
  return {
    id: `${situationSlug}:${item.key}`,
    situationId: situationSlug,
    term: item.term,
    type: item.type,
    pos: resolvePos(item.type, item.term, item.pos),
    level: normalizeCefrLevel(item.level),
    meaning: item.meaning,
    context: item.context,
    patterns: item.patterns ?? [],
    examples: (item.examples ?? []).map(([label, sentence]) => ({ label, sentence })),
    alternatives: item.alternatives ?? [],
    notes: item.notes ?? [],
    pronunciation: item.pronunciation ?? null,
    countability: item.countability ?? null,
  };
}

function findPackItem(
  situationId: string,
  itemId: string,
): { situation: PackSituation; item: PackItem } | undefined {
  const situation = packs.situations.find((entry) => entry.slug === situationId);
  if (!situation) {
    return undefined;
  }
  const key = itemId.includes(':') ? itemId.slice(itemId.indexOf(':') + 1) : itemId;
  const item = situation.items.find((entry) => entry.key === key);
  if (!item) {
    return undefined;
  }
  return { situation, item };
}

export function getLocalSituations(): VocabularySituation[] {
  return [...packs.situations]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((situation) => ({
      id: situation.slug,
      title: situation.title,
      description: situation.description,
      learned: 0,
      total: situation.items.length,
    }));
}

export function getLocalSituation(situationId: string): VocabularySituation | undefined {
  return getLocalSituations().find((item) => item.id === situationId);
}

export function getLocalCoreExpressions(situationId: string): VocabularyExpression[] {
  const situation = packs.situations.find((item) => item.slug === situationId);
  if (!situation) {
    return [];
  }
  return situation.items
    .filter((item) => item.isCore)
    .sort((a, b) => (a.coreOrder ?? 99) - (b.coreOrder ?? 99))
    .map((item) => mapExpression(situation.slug, item));
}

export function getLocalCoreItemIds(situationId: string): string[] {
  return getLocalCoreExpressions(situationId).map((item) => item.id);
}

export type LocalLibraryQuery = {
  query?: string;
  situationSlug?: string;
  level?: string;
  offset?: number;
  limit?: number;
};

export function searchLocalLibrary(input: LocalLibraryQuery): {
  items: VocabularyExpression[];
  total: number;
} {
  const query = (input.query ?? '').trim().toLowerCase();
  const offset = Math.max(0, input.offset ?? 0);
  const limit = Math.max(1, Math.min(100, input.limit ?? 40));
  const ranked: Array<{ row: VocabularyExpression; rank: number }> = [];
  for (const situation of [...packs.situations].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (input.situationSlug && situation.slug !== input.situationSlug) {
      continue;
    }
    for (const item of situation.items) {
      if (input.level && normalizeCefrLevel(item.level) !== input.level) {
        continue;
      }
      if (
        query &&
        !item.term.toLowerCase().includes(query) &&
        !item.meaning.toLowerCase().includes(query)
      ) {
        continue;
      }
      const mapped = mapExpression(situation.slug, item);
      ranked.push({
        rank: libraryRank(item),
        row: { ...mapped, situationSlug: situation.slug, situationTitle: situation.title },
      });
    }
  }
  ranked.sort((a, b) => a.rank - b.rank);
  const rows = ranked.map((entry) => entry.row);
  return { items: rows.slice(offset, offset + limit), total: rows.length };
}

export function getLocalExpressions(
  situationId: string,
  limit = VOCABULARY_PREVIEW_LIST_LIMIT,
): VocabularyExpression[] {
  const situation = packs.situations.find((item) => item.slug === situationId);
  if (!situation) {
    return [];
  }
  return situation.items.slice(0, limit).map((item) => mapExpression(situation.slug, item));
}

export function getLocalExpressionTotal(situationId: string): number {
  return packs.situations.find((item) => item.slug === situationId)?.items.length ?? 0;
}

export function getLocalLevelTotals(situationId: string): Partial<Record<CefrLevel, number>> {
  const situation = packs.situations.find((item) => item.slug === situationId);
  const totals: Partial<Record<CefrLevel, number>> = {};
  if (!situation) {
    return totals;
  }
  for (const item of situation.items) {
    const level = normalizeCefrLevel(item.level);
    totals[level] = (totals[level] ?? 0) + 1;
  }
  return totals;
}

export function getLocalTerm(
  situationId: string,
  itemId: string,
): VocabularyTermDetail | undefined {
  const found = findPackItem(situationId, itemId);
  if (!found) {
    return undefined;
  }
  return mapTermDetail(found.situation.slug, found.item);
}

/** Map pack exercises for one situation into the practice engine shape. */
export function getLocalSituationExercises(situationSlug: string): VocabularyExercise[] {
  const situation = packs.situations.find((entry) => entry.slug === situationSlug);
  if (!situation) {
    return [];
  }
  const mapped: VocabularyExercise[] = [];
  for (const item of situation.items) {
    for (const exercise of item.exercises ?? []) {
      const next = mapPackExercise(situation.slug, item, exercise);
      if (next) {
        mapped.push(next);
      }
    }
  }
  return mapped;
}

/** Resolve a local preview label for an item id (`situationSlug:itemKey`). */
export function resolveLocalItemLabel(itemId: string): string {
  const [situationId, ...rest] = itemId.split(':');
  const key = rest.join(':');
  if (!situationId || !key) {
    return itemId;
  }
  const match = getLocalExpressions(situationId).find((row) => row.id === itemId);
  return match?.text ?? key;
}

export function getLocalPracticeQuestions(
  situationId: string,
  options?: { preferItemIds?: string[]; questionCount?: number },
): PracticeQuestion[] {
  const situation = packs.situations.find((item) => item.slug === situationId);
  if (!situation || situation.items.length === 0) {
    return [];
  }

  const count = options?.questionCount ?? VOCABULARY_PRACTICE_QUESTION_COUNT;
  const prefer = new Set(options?.preferItemIds ?? []);

  const chooseRows = situation.items
    .map((item) => {
      const exercise = (item.exercises ?? []).find((entry) => entry.type === 'choose_expression');
      return exercise ? { item, exercise } : null;
    })
    .filter((row): row is { item: PackItem; exercise: PackExercise } => row != null);

  if (chooseRows.length > 0) {
    const preferred = chooseRows.filter((row) => prefer.has(`${situation.slug}:${row.item.key}`));
    const rest = chooseRows.filter((row) => !prefer.has(`${situation.slug}:${row.item.key}`));
    const selected = shuffle([...shuffle(preferred), ...shuffle(rest)]).slice(0, count);

    return selected.map(({ item, exercise }) => {
      const payload = exercise.payload as {
        options?: Array<{ id: string; text: string }>;
        correctOptionId?: string;
      };
      const optionsList = payload.options ?? [];
      const correctIndex = Math.max(
        0,
        optionsList.findIndex((option) => option.id === payload.correctOptionId),
      );
      const feedback = exercise.feedback;
      return {
        id: `${situation.slug}:${exercise.key}`,
        itemId: `${situation.slug}:${item.key}`,
        prompt: exercise.prompt,
        question: 'Which term or expression fits?',
        options: optionsList.map((option) => option.text),
        correctIndex,
        insightTitle: feedback?.expression ?? item.term,
        insightBody: feedback?.explanation
          ? `${feedback.meaning ?? item.meaning} ${feedback.explanation}`
          : item.meaning,
      };
    });
  }

  const preferred = situation.items.filter((item) => prefer.has(`${situation.slug}:${item.key}`));
  const rest = situation.items.filter((item) => !prefer.has(`${situation.slug}:${item.key}`));
  const pool = shuffle([...shuffle(preferred), ...shuffle(rest)]).slice(0, count);

  return pool.map((item, index) => {
    const itemId = `${situation.slug}:${item.key}`;
    const reverse = index % 2 === 1;
    const distractorPool = situation.items.filter((candidate) => candidate.key !== item.key);
    if (reverse) {
      const meaningOptions = shuffle([
        item.meaning,
        ...shuffle(distractorPool)
          .slice(0, 3)
          .map((candidate) => candidate.meaning),
      ]);
      while (meaningOptions.length < 4) {
        meaningOptions.push(`Meaning ${meaningOptions.length + 1}`);
      }
      const correctIndex = meaningOptions.indexOf(item.meaning);
      return {
        id: `${situation.slug}-q-${item.key}-${index}`,
        itemId,
        prompt: item.term,
        question: 'What does this mean?',
        options: meaningOptions,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        insightTitle: item.term,
        insightBody: item.examples?.[0]?.[1]
          ? `${item.meaning} Example: ${item.examples[0][1]}`
          : item.meaning,
      };
    }

    const termOptions = shuffle([
      item.term,
      ...shuffle(distractorPool)
        .slice(0, 3)
        .map((candidate) => candidate.term),
    ]);
    while (termOptions.length < 4) {
      termOptions.push(`Option ${termOptions.length + 1}`);
    }
    const correctIndex = termOptions.indexOf(item.term);
    const example = item.examples?.[0]?.[1];
    return {
      id: `${situation.slug}-q-${item.key}-${index}`,
      itemId,
      prompt: item.meaning,
      question: 'Which term or expression fits?',
      options: termOptions,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      insightTitle: item.term,
      insightBody: example ? `${item.meaning} Example: ${example}` : item.meaning,
    };
  });
}
