import {
  GRAMMAR_EXERCISES,
  GRAMMAR_LESSONS,
  GRAMMAR_TOPICS,
} from '@/features/grammar/data/seedInventory';
import { GRAMMAR_LEVELS, GRAMMAR_TENSE_SLUGS, GRAMMAR_TOPIC_SLUGS } from '@/features/grammar/types';
import {
  validateExercise,
  validateLessonDefinition,
  validateTopicDefinition,
} from '@/features/grammar/validation/content';

import { FIXTURE_EXERCISES, FIXTURE_LESSON } from '../../../../helpers/grammarFixtures';

describe('grammar content contract', () => {
  it('defines 12 lean v2 topic slugs; levels live on lessons', () => {
    expect(GRAMMAR_TOPIC_SLUGS).toEqual(GRAMMAR_TENSE_SLUGS);
    expect(GRAMMAR_TOPIC_SLUGS).toHaveLength(12);
    expect(GRAMMAR_LEVELS).toEqual(['A2', 'B1', 'B2', 'C1']);
    expect(GRAMMAR_TOPICS).toEqual([]);
    expect(GRAMMAR_LESSONS).toEqual([]);
    expect(GRAMMAR_EXERCISES).toEqual([]);
  });

  it('keeps test fixtures valid against the content contract', () => {
    expect(
      validateTopicDefinition({
        slug: 'present-simple',
        title: 'Present Simple',
        description: 'Habits and facts for software teams in standups and docs.',
        sortOrder: 1,
        categorySlug: 'core-tenses',
        curriculumVersion: 2,
        isOptional: false,
      }),
    ).toEqual({ ok: true });
    expect(validateLessonDefinition(FIXTURE_LESSON)).toEqual({ ok: true });
    for (const exercise of FIXTURE_EXERCISES) {
      expect(validateExercise(exercise)).toEqual({ ok: true });
    }
  });
});
