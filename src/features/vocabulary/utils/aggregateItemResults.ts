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
  const itemBuckets = new Map<string, { results: boolean[]; situationId: string }>();

  for (const exercise of exercises) {
    if (!exercise.itemId) {
      continue;
    }
    const answer = byExercise.get(exercise.id);
    if (!answer) {
      continue;
    }
    const existing = itemBuckets.get(exercise.itemId);
    if (existing) {
      existing.results.push(answer.correct && !answer.skipped);
      continue;
    }
    itemBuckets.set(exercise.itemId, {
      results: [answer.correct && !answer.skipped],
      situationId: exercise.situationId,
    });
  }

  return [...itemBuckets.entries()].map(([itemId, bucket]) => ({
    itemId,
    correct: bucket.results.every(Boolean),
    situationId: bucket.situationId,
  }));
}
