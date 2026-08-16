import { buildCorePracticeExercises } from '@/features/vocabulary/utils/corePracticeExercises';

describe('buildCorePracticeExercises', () => {
  it('builds a choose + fill pair from a core phrase', () => {
    const exercises = buildCorePracticeExercises(
      {
        key: 'on-track',
        term: 'on track',
        meaning: 'Progress matches the plan.',
        context: 'Standup',
        examples: [['Standup', 'We are on track for Friday.']],
      },
      ['on track', 'blocked on', 'hotfix'],
    );
    expect(exercises).toHaveLength(2);
    expect(exercises[0]?.type).toBe('choose_expression');
    expect(exercises[1]?.type).toBe('fill_blank');
    expect(String(exercises[1]?.prompt)).toContain('___');
  });
});
