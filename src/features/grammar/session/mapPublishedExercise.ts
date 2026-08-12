import type { PublishedExercise } from '@/features/grammar/services/parsers';
import type { GrammarExercise, GrammarTopicSlug } from '@/features/grammar/types/content';

export function mapPublishedExercise(
  exercise: PublishedExercise,
  topicSlug: GrammarTopicSlug,
  lessonSlug: string,
): GrammarExercise {
  const base = {
    id: exercise.id,
    topicSlug,
    lessonSlug,
    prompt: exercise.prompt,
    explanation: exercise.explanation,
    sortOrder: exercise.sortOrder,
    contentSchemaVersion: exercise.contentSchemaVersion,
  };

  switch (exercise.type) {
    case 'multiple_choice':
      return {
        ...base,
        type: 'multiple_choice',
        payload: exercise.payload as Extract<
          GrammarExercise,
          { type: 'multiple_choice' }
        >['payload'],
        answer: exercise.answer as Extract<GrammarExercise, { type: 'multiple_choice' }>['answer'],
      };
    case 'fill_blank':
      return {
        ...base,
        type: 'fill_blank',
        payload: exercise.payload as Extract<GrammarExercise, { type: 'fill_blank' }>['payload'],
        answer: exercise.answer as Extract<GrammarExercise, { type: 'fill_blank' }>['answer'],
      };
    case 'sentence_order':
      return {
        ...base,
        type: 'sentence_order',
        payload: exercise.payload as Extract<
          GrammarExercise,
          { type: 'sentence_order' }
        >['payload'],
        answer: exercise.answer as Extract<GrammarExercise, { type: 'sentence_order' }>['answer'],
      };
    default: {
      const exhaustive: never = exercise.type;
      throw new Error(`Unsupported exercise type: ${String(exhaustive)}`);
    }
  }
}
