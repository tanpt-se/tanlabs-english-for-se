import type { VocabularyExercise } from '@/features/vocabulary/types/content';
import { normalizeCefrLevel, type CefrLevel } from '@/features/vocabulary/utils/levels';
import { mapPackExercise } from '@/features/vocabulary/utils/mapPackExercise';
import { resolvePos, type VocabularyPos } from '@/features/vocabulary/utils/pos';

import packsJson from '../../../../supabase/seed/vocabulary/packs.json';

type VocabularySituation = {
  id: string;
  title: string;
  description: string;
  learned: number;
  total: number;
};

export type VocabularyExpression = {
  id: string;
  text: string;
  tag: string;
  intent?: string;
  needsPractice?: boolean;
  level: CefrLevel;
  pos: VocabularyPos;
  context?: string;
};

export type VocabularyTermDetail = {
  id: string;
  situationId: string;
  term: string;
  type: 'word' | 'phrase' | 'expression';
  pos: VocabularyPos;
  level: CefrLevel;
  meaning: string;
  context: string;
  patterns: string[];
  examples: Array<{ label: string; sentence: string }>;
  alternatives: string[];
  notes: string[];
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

/** Cap list rendering so ScrollView stays usable while browsing 500-item packs. */
export const VOCABULARY_PREVIEW_LIST_LIMIT = 120;
export const VOCABULARY_PRACTICE_QUESTION_COUNT = 20;

const packs = packsJson as unknown as PacksRoot;

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
    needsPractice: item.type === 'expression',
    level,
    pos,
    context: item.context,
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
