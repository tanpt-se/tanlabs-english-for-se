jest.mock('../../../../../supabase/seed/vocabulary/packs.json', () => {
  const { TINY_VOCABULARY_PACKS } = require('../../../../helpers/vocabularyFixtures') as {
    TINY_VOCABULARY_PACKS: { situations: Array<{ slug: string; items: Array<{ term: string }> }> };
  };
  return TINY_VOCABULARY_PACKS;
});

jest.mock('../../../../../supabase/seed/vocabulary/core-expressions.json', () => ({
  situations: [
    {
      slug: 'task-progress',
      items: [
        {
          term: "I'm blocked by the API dependency.",
          type: 'expression',
          meaning: 'Core overlay meaning',
          context: 'Standup',
          level: 'A2',
          coreOrder: 1,
          pronunciation: 'blocked',
          countability: 'na',
        },
        {
          term: 'on track',
          type: 'phrase',
          meaning: 'Progress matches the plan.',
          context: 'Standup',
          level: 'A2',
          coreOrder: 2,
          pos: 'phrase',
          patterns: ['on track'],
          examples: [['standup', 'The auth work is on track.']],
          pronunciation: 'on trak',
          countability: 'na',
        },
        {
          term: 'ship',
          type: 'word',
          meaning: 'Deliver to production',
          context: 'Release',
          level: 'B1',
          coreOrder: 3,
        },
        {
          term: 'raise a blocker',
          type: 'phrase',
          meaning: 'Call out a stop in standup.',
          context: 'Standup',
          level: 'A2',
          coreOrder: 4,
        },
      ],
    },
  ],
}));

import {
  getLocalCoreExpressions,
  getLocalCoreItemIds,
  getLocalExpressionTotal,
  getLocalSituationExercises,
} from '@/features/vocabulary/data/localPackCatalog';

describe('localPackCatalog core overlay', () => {
  it('marks existing terms core and inserts missing core phrases', () => {
    const cores = getLocalCoreExpressions('task-progress');
    expect(cores.map((item) => item.text)).toEqual([
      "I'm blocked by the API dependency.",
      'on track',
      'ship',
      'raise a blocker',
    ]);
    expect(getLocalCoreItemIds('task-progress')).toHaveLength(4);
    expect(getLocalExpressionTotal('task-progress')).toBeGreaterThan(3);
    expect(cores[0]?.pronunciation).toBe('blocked');
    expect(cores[1]?.pronunciation).toBe('on trak');
    expect(cores[2]?.pronunciation).toBeNull();
    expect(cores[2]?.countability).toBe('na');
    expect(cores[3]?.pronunciation).toBeNull();
    const generated = getLocalSituationExercises('task-progress').filter((row) =>
      row.id.includes('raise-a-blocker'),
    );
    expect(generated.length).toBeGreaterThanOrEqual(2);
  });
});
