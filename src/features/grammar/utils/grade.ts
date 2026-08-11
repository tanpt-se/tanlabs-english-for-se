import type { GrammarExercise } from '@/features/grammar/types/content';
import { normalizeFillBlank } from '@/features/grammar/utils/normalize';

export type GradeResult = {
  correct: boolean;
  explanation: string;
  /** Stable selected identifiers for persistence (never raw fill text). */
  selectedIds?: string[];
};

export type LearnerResponse =
  | { type: 'multiple_choice'; optionId: string }
  | { type: 'fill_blank'; text: string }
  | { type: 'sentence_order'; tokenIds: string[] };

export function gradeExercise(
  exercise: GrammarExercise,
  response: LearnerResponse,
): GradeResult | { error: string } {
  if (response.type !== exercise.type) {
    return { error: 'Response type mismatch' };
  }

  switch (exercise.type) {
    case 'multiple_choice': {
      if (response.type !== 'multiple_choice') {
        return { error: 'Response type mismatch' };
      }
      const known = new Set(exercise.payload.options.map((item) => item.id));
      if (!known.has(response.optionId)) {
        return { error: 'Unknown option id' };
      }
      return {
        correct: response.optionId === exercise.answer.optionId,
        explanation: exercise.explanation,
        selectedIds: [response.optionId],
      };
    }
    case 'fill_blank': {
      if (response.type !== 'fill_blank') {
        return { error: 'Response type mismatch' };
      }
      const normalized = normalizeFillBlank(response.text);
      if (!normalized) {
        return { error: 'Empty fill-blank response' };
      }
      const accepted = exercise.answer.accepted.map(normalizeFillBlank);
      return {
        correct: accepted.includes(normalized),
        explanation: exercise.explanation,
      };
    }
    case 'sentence_order': {
      if (response.type !== 'sentence_order') {
        return { error: 'Response type mismatch' };
      }
      const known = new Set(exercise.payload.tokens.map((item) => item.id));
      if (response.tokenIds.length !== exercise.answer.tokenIds.length) {
        return { error: 'tokenIds length mismatch' };
      }
      for (const id of response.tokenIds) {
        if (!known.has(id)) {
          return { error: 'Unknown token id' };
        }
      }
      const correct = response.tokenIds.every(
        (id, index) => id === exercise.answer.tokenIds[index],
      );
      return {
        correct,
        explanation: exercise.explanation,
        selectedIds: [...response.tokenIds],
      };
    }
    default:
      return { error: 'Unknown exercise type' };
  }
}
