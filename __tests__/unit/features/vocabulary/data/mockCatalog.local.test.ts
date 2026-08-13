jest.mock('@/app/config/env', () => ({
  VOCABULARY_FORCE_LOCAL_SEED: true,
  isDevelopment: true,
  isProduction: false,
  APP_ENV: 'development',
}));

jest.mock('@/features/vocabulary/data/localPackCatalog', () => ({
  getLocalSituations: jest.fn(() => [
    { id: 'task-progress', title: 'Task', description: 'd', learned: 0, total: 2 },
  ]),
  getLocalSituation: jest.fn((id: string) =>
    id === 'task-progress'
      ? { id: 'task-progress', title: 'Task', description: 'd', learned: 0, total: 2 }
      : undefined,
  ),
  getLocalExpressions: jest.fn(() => [
    {
      id: 'task-progress:a',
      text: 'a',
      tag: 'word · A2',
      level: 'A2',
      pos: 'n',
    },
  ]),
  getLocalLevelTotals: jest.fn(() => ({ A2: 1 })),
  getLocalExpressionTotal: jest.fn(() => 200),
  getLocalTerm: jest.fn(() => ({
    id: 'task-progress:a',
    situationId: 'task-progress',
    term: 'a',
    type: 'word',
    pos: 'n',
    level: 'A2',
    meaning: 'm',
    context: 'c',
    patterns: [],
    examples: [],
    alternatives: [],
    notes: [],
  })),
  getLocalPracticeQuestions: jest.fn(() => [
    {
      id: 'q1',
      prompt: 'p',
      question: 'q',
      options: ['a', 'b', 'c', 'd'],
      correctIndex: 0,
      insightTitle: 't',
      insightBody: 'b',
    },
  ]),
  VOCABULARY_PREVIEW_LIST_LIMIT: 120,
}));

import {
  formatProgress,
  getExpressionListMeta,
  getExpressions,
  getLevelTotals,
  getPracticeQuestions,
  getSituation,
  getTerm,
  isVocabularyLocalPackPreview,
  VOCABULARY_SITUATIONS,
} from '@/features/vocabulary/data/mockCatalog';

describe('mockCatalog local seed path', () => {
  it('delegates to localPackCatalog helpers', () => {
    expect(VOCABULARY_SITUATIONS[0]?.id).toBe('task-progress');
    expect(getSituation('task-progress')?.title).toBe('Task');
    expect(getSituation('missing')).toBeUndefined();
    expect(getExpressions('task-progress')).toHaveLength(1);
    expect(getLevelTotals('task-progress')).toEqual({ A2: 1 });
    expect(getExpressionListMeta('task-progress')).toEqual({
      shown: 120,
      total: 200,
      capped: true,
    });
    expect(getTerm('task-progress', 'task-progress:a')?.term).toBe('a');
    expect(getPracticeQuestions('task-progress')).toHaveLength(1);
    expect(isVocabularyLocalPackPreview()).toBe(true);
    expect(formatProgress(0, 0)).toBe('0 / 0');
  });
});
