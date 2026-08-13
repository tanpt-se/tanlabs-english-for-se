import type { VocabularyExercise } from '@/features/vocabulary/types/content';
import { normalizeFillBlank } from '@/features/vocabulary/utils/normalize';

export type GradeResult = {
  correct: boolean;
  explanation: string;
  selectedIds?: string[];
};

export type LearnerResponse =
  | { type: 'choose_expression'; optionId: string }
  | { type: 'fill_blank'; text: string }
  | { type: 'sentence_order'; tokenIds: string[] };

export function gradeExercise(
  exercise: VocabularyExercise,
  response: LearnerResponse,
): GradeResult | { error: string } {
  if (response.type !== exercise.type) {
    return { error: 'Response type mismatch' };
  }

  switch (exercise.type) {
    case 'choose_expression': {
      if (response.type !== 'choose_expression') {
        return { error: 'Response type mismatch' };
      }
      const known = new Set(exercise.payload.options.map((item) => item.id));
      if (!known.has(response.optionId)) {
        return { error: 'Unknown option id' };
      }
      return {
        correct: response.optionId === exercise.answer.optionId,
        explanation: exercise.feedback.explanation,
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
        explanation: exercise.feedback.explanation,
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
        explanation: exercise.feedback.explanation,
        selectedIds: [...response.tokenIds],
      };
    }
    default:
      return { error: 'Unknown exercise type' };
  }
}
