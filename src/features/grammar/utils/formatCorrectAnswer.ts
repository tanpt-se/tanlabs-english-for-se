import type { GrammarExercise } from '@/features/grammar/types/content';

export function formatCorrectAnswer(exercise: GrammarExercise): string {
  if (exercise.type === 'multiple_choice') {
    const option = exercise.payload.options.find((item) => item.id === exercise.answer.optionId);
    return option?.label ?? exercise.answer.optionId;
  }
  if (exercise.type === 'fill_blank') {
    return exercise.answer.accepted[0] ?? '';
  }
  const byId = new Map(exercise.payload.tokens.map((token) => [token.id, token.text]));
  return exercise.answer.tokenIds.map((id) => byId.get(id) ?? id).join(' ');
}
