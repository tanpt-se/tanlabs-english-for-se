import type { GrammarExercise } from '@/features/grammar/types/content';
import { shuffleArray } from '@/features/grammar/utils/shuffle';

export function shufflePracticeExercises(
  exercises: readonly GrammarExercise[],
  random: () => number = Math.random,
): GrammarExercise[] {
  const withShuffledChoices = exercises.map((exercise) => shuffleExerciseChoices(exercise, random));
  return shuffleArray(withShuffledChoices, random);
}

function shuffleExerciseChoices(exercise: GrammarExercise, random: () => number): GrammarExercise {
  if (exercise.type === 'multiple_choice') {
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
