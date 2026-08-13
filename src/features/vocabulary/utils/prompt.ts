import type {
  VocabularyExercise,
  VocabularyExerciseType,
} from '@/features/vocabulary/types/content';

const DEFAULT_INSTRUCTION: Record<VocabularyExerciseType, string> = {
  choose_expression: 'Choose the best expression',
  fill_blank: 'Fill in the blank',
  sentence_order: 'Put the words in order',
};

const INSTRUCTION_PREFIX =
  /^(Choose the best expression|Choose the correct expression|Fill in the blank|Put the words in order|Order the tokens)\s*[:.—-]?\s*/i;

export type SplitExercisePrompt = {
  instruction: string;
  stem: string;
};

export function splitExercisePrompt(
  prompt: string,
  type: VocabularyExerciseType,
): SplitExercisePrompt {
  const trimmed = prompt.trim();
  const match = trimmed.match(INSTRUCTION_PREFIX);
  const stem = match ? trimmed.slice(match[0].length).trim() || trimmed : trimmed;
  return {
    instruction: DEFAULT_INSTRUCTION[type],
    stem,
  };
}

export function formatCorrectAnswer(exercise: VocabularyExercise): string {
  if (exercise.type === 'choose_expression') {
    const option = exercise.payload.options.find((item) => item.id === exercise.answer.optionId);
    return option?.text ?? exercise.answer.optionId;
  }
  if (exercise.type === 'fill_blank') {
    return exercise.answer.accepted[0] ?? '';
  }
  const byId = new Map(exercise.payload.tokens.map((token) => [token.id, token.text]));
  return exercise.answer.tokenIds.map((id) => byId.get(id) ?? id).join(' ');
}
