import type {
  VocabularyExercise,
  VocabularyExerciseType,
} from '@/features/vocabulary/types/content';
import { shuffleArray } from '@/features/vocabulary/utils/shuffle';

export const SESSION_TARGET = 10;
export const SESSION_MIN = 8;
export const SESSION_MAX = 12;
export const SESSION_MIX: Record<VocabularyExerciseType, number> = {
  choose_expression: 5,
  fill_blank: 3,
  sentence_order: 2,
};

export type ComposeSessionResult =
  | { ok: true; exercises: VocabularyExercise[] }
  | { ok: false; reason: 'insufficient_content'; available: number };

/**
 * Compose 8–12 exercises for one situation, preferring 5/3/2 for a 10-question session.
 */
export function composeSituationSession(
  pool: readonly VocabularyExercise[],
  options?: { preferItemIds?: string[]; targetTotal?: number; random?: () => number },
): ComposeSessionResult {
  const random = options?.random ?? Math.random;
  const target = Math.max(
    SESSION_MIN,
    Math.min(SESSION_MAX, options?.targetTotal ?? SESSION_TARGET),
  );
  const prefer = new Set(options?.preferItemIds ?? []);
  const published = pool.filter((exercise) => Boolean(exercise.id));
  if (published.length < SESSION_MIN) {
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

  for (const type of Object.keys(SESSION_MIX) as VocabularyExerciseType[]) {
    const want = SESSION_MIX[type];
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

  if (selected.length < SESSION_MIN) {
    return { ok: false, reason: 'insufficient_content', available: selected.length };
  }

  return {
    ok: true,
    exercises: shuffleArray(selected.slice(0, Math.min(SESSION_MAX, selected.length)), random),
  };
}

export function composeWeakSession(
  pool: readonly VocabularyExercise[],
  weakItemIds: readonly string[],
  options?: { targetTotal?: number; random?: () => number },
): ComposeSessionResult {
  const allowed = new Set(weakItemIds);
  const filtered = pool.filter((exercise) => exercise.itemId && allowed.has(exercise.itemId));
  return composeSituationSession(filtered, options);
}
