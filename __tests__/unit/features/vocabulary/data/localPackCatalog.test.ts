jest.mock('../../../../../supabase/seed/vocabulary/packs.json', () => {
  const { TINY_VOCABULARY_PACKS } = require('../../../../helpers/vocabularyFixtures') as {
    TINY_VOCABULARY_PACKS: unknown;
  };
  return TINY_VOCABULARY_PACKS;
});

jest.mock('../../../../../supabase/seed/vocabulary/core-expressions.json', () => ({
  situations: [],
}));

import {
  getLocalExpressionTotal,
  getLocalExpressions,
  getLocalLevelTotals,
  getLocalPracticeQuestions,
  getLocalSituation,
  getLocalSituationExercises,
  getLocalSituations,
  getLocalTerm,
  getLocalCoreExpressions,
  getLocalCoreItemIds,
  resolveLocalItemLabel,
  searchLocalLibrary,
  VOCABULARY_PRACTICE_QUESTION_COUNT,
  VOCABULARY_PREVIEW_LIST_LIMIT,
} from '@/features/vocabulary/data/localPackCatalog';

describe('localPackCatalog (tiny packs mock)', () => {
  it('lists situations sorted with totals', () => {
    const situations = getLocalSituations();
    expect(situations.map((row) => row.id)).toEqual([
      'task-progress',
      'meetings',
      'bugs-problems',
      'daily-standup',
      'client-communication',
    ]);
    expect(getLocalSituation('task-progress')?.title).toBe('Task & Progress');
    expect(getLocalSituation('missing')).toBeUndefined();
    expect(getLocalExpressionTotal('task-progress')).toBe(3);
    expect(getLocalExpressionTotal('missing')).toBe(0);
  });

  it('maps expressions, levels, terms, and exercises', () => {
    const expressions = getLocalExpressions('task-progress');
    expect(expressions[0]?.id).toBe('task-progress:blocker');
    expect(expressions[0]?.needsPractice).toBe(true);
    expect(getLocalExpressions('missing')).toEqual([]);
    expect(getLocalExpressions('task-progress', 1)).toHaveLength(1);
    expect(VOCABULARY_PREVIEW_LIST_LIMIT).toBe(120);

    expect(getLocalLevelTotals('task-progress')).toEqual({ A2: 1, B1: 1, B2: 1 });
    expect(getLocalLevelTotals('missing')).toEqual({});

    const term = getLocalTerm('task-progress', 'task-progress:blocker');
    expect(term?.term).toContain('blocked');
    expect(term?.patterns).toEqual(['be blocked by']);
    expect(getLocalTerm('task-progress', 'missing')).toBeUndefined();
    expect(getLocalTerm('missing', 'x')).toBeUndefined();

    const exercises = getLocalSituationExercises('task-progress');
    expect(exercises.some((row) => row.type === 'choose_expression')).toBe(true);
    expect(exercises.some((row) => row.type === 'fill_blank')).toBe(true);
    expect(exercises.some((row) => row.type === 'sentence_order')).toBe(true);
    // bad choose (1 option) from client-communication is dropped
    expect(getLocalSituationExercises('client-communication')).toEqual([]);
    expect(getLocalSituationExercises('missing')).toEqual([]);
  });

  it('resolves labels and builds practice questions', () => {
    expect(resolveLocalItemLabel('task-progress:blocker')).toContain('blocked');
    expect(resolveLocalItemLabel('task-progress:unknown')).toBe('unknown');
    expect(resolveLocalItemLabel('nocolon')).toBe('nocolon');

    const preferred = getLocalPracticeQuestions('task-progress', {
      preferItemIds: ['task-progress:ship'],
      questionCount: 2,
    });
    expect(preferred.length).toBeGreaterThan(0);
    expect(preferred[0]?.options.length).toBeGreaterThanOrEqual(2);
    expect(VOCABULARY_PRACTICE_QUESTION_COUNT).toBe(20);

    expect(getLocalPracticeQuestions('bugs-problems')).toEqual([]);
    expect(getLocalPracticeQuestions('missing')).toEqual([]);

    // Fallback path when no choose_expression rows exist
    const fallback = getLocalPracticeQuestions('meetings', { questionCount: 2 });
    expect(fallback).toHaveLength(2);
    expect(fallback.every((row) => row.options.length === 4)).toBe(true);
    // index 1 is reverse meaning path; with only 1 distractor the while-pad runs
    expect(fallback[1]?.question).toBe('What does this mean?');

    // Force reverse meaning path with multiple non-choose items
    const standup = getLocalPracticeQuestions('daily-standup', { questionCount: 4 });
    expect(standup.length).toBeGreaterThan(0);

    // Prefer empty + default count
    expect(getLocalPracticeQuestions('task-progress').length).toBeGreaterThan(0);
  });

  it('returns empty cores without overlay and searches the library', () => {
    expect(getLocalCoreExpressions('task-progress')).toEqual([]);
    expect(getLocalCoreItemIds('task-progress')).toEqual([]);
    const page = searchLocalLibrary({ query: 'block', limit: 10 });
    expect(page.total).toBeGreaterThan(0);
    expect(page.items.some((item) => item.text.toLowerCase().includes('block'))).toBe(true);
    const meaningHits = searchLocalLibrary({
      query: 'Something that stops',
      offset: 0,
      limit: 10,
    });
    expect(meaningHits.total).toBeGreaterThan(0);
    expect(searchLocalLibrary({ situationSlug: 'missing' }).total).toBe(0);
    const a2 = searchLocalLibrary({ level: 'A2' });
    const all = searchLocalLibrary({});
    expect(a2.total).toBeGreaterThan(0);
    expect(a2.total).toBeLessThan(all.total);
    expect(all.items[0]?.text.toLowerCase()).toContain('block');
    expect(getLocalLevelTotals('daily-standup').A2).toBe(2);
  });
});
