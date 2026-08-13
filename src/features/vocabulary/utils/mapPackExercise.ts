import type { VocabularyExercise, VocabularyFeedback } from '@/features/vocabulary/types/content';
import { VOCABULARY_CONTENT_SCHEMA_VERSION } from '@/features/vocabulary/types/content';

type PackExerciseLike = {
  key: string;
  type: string;
  prompt: string;
  payload: Record<string, unknown>;
  feedback?: Partial<VocabularyFeedback>;
  sortOrder?: number;
};

function feedbackOf(
  item: {
    term: string;
    meaning: string;
    context: string;
    examples?: [string, string][];
  },
  exercise: PackExerciseLike,
): VocabularyFeedback {
  const fb = exercise.feedback ?? {};
  return {
    expression: fb.expression ?? item.term,
    meaning: fb.meaning ?? item.meaning,
    context: fb.context ?? item.context,
    example: fb.example ?? item.examples?.[0]?.[1] ?? item.term,
    explanation: fb.explanation ?? `“${item.term}” fits this workplace context.`,
  };
}

/** Map a pack JSON exercise into the engine VocabularyExercise shape. */
export function mapPackExercise(
  situationSlug: string,
  item: {
    key: string;
    term: string;
    meaning: string;
    context: string;
    examples?: [string, string][];
  },
  exercise: PackExerciseLike,
): VocabularyExercise | null {
  const id = `${situationSlug}:${exercise.key}`;
  const itemId = `${situationSlug}:${item.key}`;
  const feedback = feedbackOf(item, exercise);
  const base = {
    id,
    situationId: situationSlug,
    itemId,
    prompt: exercise.prompt,
    feedback,
    sortOrder: exercise.sortOrder ?? 1,
    contentSchemaVersion: VOCABULARY_CONTENT_SCHEMA_VERSION,
  };

  if (exercise.type === 'choose_expression') {
    const options =
      (exercise.payload.options as Array<{ id: string; text: string }> | undefined) ?? [];
    const correctOptionId = exercise.payload.correctOptionId as string | undefined;
    if (options.length < 2 || !correctOptionId) {
      return null;
    }
    return {
      ...base,
      type: 'choose_expression',
      payload: { options },
      answer: { optionId: correctOptionId },
    };
  }

  if (exercise.type === 'fill_blank') {
    const accepted = (exercise.payload.accepted as string[] | undefined) ?? [];
    if (accepted.length < 1 || !exercise.prompt.includes('___')) {
      return null;
    }
    return {
      ...base,
      type: 'fill_blank',
      payload: {
        accepted,
        cue: typeof exercise.payload.cue === 'string' ? exercise.payload.cue : undefined,
      },
      answer: { accepted },
    };
  }

  if (exercise.type === 'sentence_order') {
    const tokens =
      (exercise.payload.tokens as Array<{ id: string; text: string }> | undefined) ?? [];
    const correctOrder = (exercise.payload.correctOrder as string[] | undefined) ?? [];
    if (tokens.length < 3 || correctOrder.length < 3) {
      return null;
    }
    return {
      ...base,
      type: 'sentence_order',
      payload: { tokens },
      answer: { tokenIds: correctOrder },
    };
  }

  return null;
}
