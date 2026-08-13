import type { VocabularyExercise } from '@/features/vocabulary/types/content';
import { shuffleArray } from '@/features/vocabulary/utils/shuffle';

export function shufflePracticeExercises(
  exercises: readonly VocabularyExercise[],
  random: () => number = Math.random,
): VocabularyExercise[] {
  const withShuffledChoices = exercises.map((exercise) => shuffleExerciseChoices(exercise, random));
  return shuffleArray(withShuffledChoices, random);
}

function shuffleExerciseChoices(
  exercise: VocabularyExercise,
  random: () => number,
): VocabularyExercise {
  if (exercise.type === 'choose_expression') {
    return {
      ...exercise,
      payload: {
        ...exercise.payload,
        options: shuffleArray(exercise.payload.options, random),
      },
    };
  }
  if (exercise.type === 'sentence_order') {
    return {
      ...exercise,
      payload: {
        ...exercise.payload,
        tokens: shuffleArray(exercise.payload.tokens, random),
      },
    };
  }
  return exercise;
}
