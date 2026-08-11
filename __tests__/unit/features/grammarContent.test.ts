import {
  GRAMMAR_EXERCISES,
  GRAMMAR_LESSONS,
  GRAMMAR_TOPICS,
} from '@/features/grammar/data/seedInventory';
import { GRAMMAR_TOPIC_SLUGS } from '@/features/grammar/types';
import {
  validateExercise,
  validateLessonDefinition,
  validateTopicDefinition,
} from '@/features/grammar/validation/content';

describe('PH2-01 grammar content contract', () => {
  it('defines exactly five topic slugs in order', () => {
    expect(GRAMMAR_TOPICS.map((topic) => topic.slug)).toEqual([...GRAMMAR_TOPIC_SLUGS]);
    for (const topic of GRAMMAR_TOPICS) {
      expect(validateTopicDefinition(topic)).toEqual({ ok: true });
    }
  });

  it('validates every seeded lesson and exercise', () => {
    expect(GRAMMAR_LESSONS).toHaveLength(5);
    for (const lesson of GRAMMAR_LESSONS) {
      expect(validateLessonDefinition(lesson)).toEqual({ ok: true });
    }
    expect(GRAMMAR_EXERCISES.length).toBeGreaterThanOrEqual(40);
    for (const exercise of GRAMMAR_EXERCISES) {
      expect(validateExercise(exercise)).toEqual({ ok: true });
    }
    const types = new Set(GRAMMAR_EXERCISES.map((item) => item.type));
    expect(types).toEqual(new Set(['multiple_choice', 'fill_blank', 'sentence_order']));
  });
});
