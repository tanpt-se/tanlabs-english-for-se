import type { GrammarExerciseType } from '@/features/grammar/types/content';
import { fillBlankInstruction, parseFillBlankCue } from '@/features/grammar/utils/fillBlankCue';

const DEFAULT_INSTRUCTION: Record<GrammarExerciseType, string> = {
  multiple_choice: 'Choose the correct form',
  fill_blank: 'Fill in the blank',
  sentence_order: 'Put the words in order',
};

const INSTRUCTION_PREFIX =
  /^(Choose the correct form|Choose the best option|Choose the correct option|Fill in the blank|Fill with a negative form|Fill with an affirmative form|Fill with a question form|Order the tokens|Put the words in order)\s*[:.—-]?\s*/i;

export type SplitExercisePrompt = {
  instruction: string;
  stem: string;
};

export function splitExercisePrompt(
  prompt: string,
  type: GrammarExerciseType,
): SplitExercisePrompt {
  const trimmed = prompt.trim();
  const match = trimmed.match(INSTRUCTION_PREFIX);
  const stem = match ? trimmed.slice(match[0].length).trim() || trimmed : trimmed;

  if (type === 'fill_blank') {
    const cue = parseFillBlankCue(stem);
    return {
      instruction: fillBlankInstruction(cue?.polarity ?? null),
      stem,
    };
  }

  return {
    instruction: DEFAULT_INSTRUCTION[type],
    stem,
  };
}
