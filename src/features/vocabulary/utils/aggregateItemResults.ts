import type {
  PrivacyBoundedAnswerRecord,
  VocabularyExercise,
  VocabularyItemOutcome,
} from '@/features/vocabulary/types/content';

/**
 * Any incorrect mapped exercise ⇒ item incorrect for the session; else correct.
 * Exercises without itemId are ignored for progress.
 */
export function aggregateItemResults(
  exercises: readonly VocabularyExercise[],
  answers: readonly PrivacyBoundedAnswerRecord[],
): VocabularyItemOutcome[] {
  const byExercise = new Map(answers.map((row) => [row.exerciseId, row]));
  const itemBuckets = new Map<string, boolean[]>();

  for (const exercise of exercises) {
    if (!exercise.itemId) {
      continue;
    }
    const answer = byExercise.get(exercise.id);
    if (!answer) {
      continue;
    }
    const list = itemBuckets.get(exercise.itemId) ?? [];
    list.push(answer.correct && !answer.skipped);
    itemBuckets.set(exercise.itemId, list);
  }

  return [...itemBuckets.entries()].map(([itemId, results]) => ({
    itemId,
    correct: results.every(Boolean),
  }));
}
