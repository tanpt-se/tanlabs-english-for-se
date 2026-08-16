import type {
  VocabularyExercise,
  VocabularyExerciseType,
} from '@/features/vocabulary/types/content';
import { shuffleArray } from '@/features/vocabulary/utils/shuffle';

export const SESSION_TARGET = 10;
export const SESSION_MIN = 8;
export const SESSION_MAX = 12;
export const CORE_SESSION_MIN = 5;
export const CORE_SESSION_MAX = 8;
export const CORE_SESSION_TARGET = 8;
export const SESSION_MIX: Record<VocabularyExerciseType, number> = {
  choose_expression: 5,
  fill_blank: 3,
  sentence_order: 2,
};

export type ComposeSessionResult =
  | { ok: true; exercises: VocabularyExercise[] }
  | { ok: false; reason: 'insufficient_content'; available: number };

/**
 * Compose a practice session. Default mix is 5/3/2 for 10 questions.
 * Core situation practice passes `minExercises` 5 and `targetTotal` 8.
 * Weak practice may pass a lower `minExercises` when the weak pool is smaller.
 */
export function composeSituationSession(
  pool: readonly VocabularyExercise[],
  options?: {
    preferItemIds?: string[];
    targetTotal?: number;
    minExercises?: number;
    random?: () => number;
  },
): ComposeSessionResult {
  const random = options?.random ?? Math.random;
  const minExercises = Math.max(1, Math.min(SESSION_MIN, options?.minExercises ?? SESSION_MIN));
  const target = Math.max(
    minExercises,
    Math.min(SESSION_MAX, options?.targetTotal ?? SESSION_TARGET),
  );
  const prefer = new Set(options?.preferItemIds ?? []);
  const published = pool.filter((exercise) => Boolean(exercise.id));
  if (published.length < minExercises) {
    return { ok: false, reason: 'insufficient_content', available: published.length };
  }

  const byType: Record<VocabularyExerciseType, VocabularyExercise[]> = {
    choose_expression: [],
    fill_blank: [],
    sentence_order: [],
  };
  for (const exercise of published) {
    byType[exercise.type].push(exercise);
  }

  const pickFrom = (list: VocabularyExercise[], count: number): VocabularyExercise[] => {
    const preferred = list.filter((item) => item.itemId && prefer.has(item.itemId));
    const rest = list.filter((item) => !(item.itemId && prefer.has(item.itemId)));
    return shuffleArray([...preferred, ...rest], random).slice(0, count);
  };

  const selected: VocabularyExercise[] = [];
  const used = new Set<string>();
  const mix = sessionMixForTarget(target);

  for (const type of Object.keys(mix) as VocabularyExerciseType[]) {
    const want = mix[type];
    for (const exercise of pickFrom(byType[type], want)) {
      if (used.has(exercise.id)) continue;
      selected.push(exercise);
      used.add(exercise.id);
    }
  }

  if (selected.length < target) {
    const leftovers = shuffleArray(
      published.filter((exercise) => !used.has(exercise.id)),
      random,
    );
    for (const exercise of leftovers) {
      if (selected.length >= target) break;
      selected.push(exercise);
      used.add(exercise.id);
    }
  }

  if (selected.length < minExercises) {
    return { ok: false, reason: 'insufficient_content', available: selected.length };
  }

  return {
    ok: true,
    exercises: shuffleArray(
      selected.slice(0, Math.min(SESSION_MAX, target, selected.length)),
      random,
    ),
  };
}

export function sessionMixForTarget(target: number): Record<VocabularyExerciseType, number> {
  if (target <= 6) {
    return { choose_expression: 3, fill_blank: 1, sentence_order: 1 };
  }
  if (target <= 8) {
    return { choose_expression: 4, fill_blank: 2, sentence_order: 2 };
  }
  return SESSION_MIX;
}

export function composeWeakSession(
  pool: readonly VocabularyExercise[],
  weakItemIds: readonly string[],
  options?: { targetTotal?: number; random?: () => number },
): ComposeSessionResult {
  const allowed = new Set(weakItemIds);
  const filtered = pool.filter((exercise) => exercise.itemId && allowed.has(exercise.itemId));
  if (filtered.length === 0) {
    return { ok: false, reason: 'insufficient_content', available: 0 };
  }
  const available = filtered.length;
  return composeSituationSession(filtered, {
    ...options,
    preferItemIds: weakItemIds,
    minExercises: Math.min(SESSION_MIN, available),
    targetTotal: Math.min(options?.targetTotal ?? SESSION_TARGET, available),
  });
}
