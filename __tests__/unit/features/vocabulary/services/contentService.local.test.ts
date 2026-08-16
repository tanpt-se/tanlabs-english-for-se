const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockGetUser = jest.fn(async () => ({
  data: { user: { id: 'user-1' } },
  error: null,
}));

jest.mock('@/app/config/env', () => ({
  VOCABULARY_FORCE_LOCAL_SEED: true,
  isDevelopment: true,
  isProduction: false,
  APP_ENV: 'development',
}));

jest.mock('@/core/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom.apply(null, args as []),
    rpc: (...args: unknown[]) => mockRpc.apply(null, args as []),
    auth: {
      getUser: (...args: unknown[]) => mockGetUser.apply(null, args as []),
    },
  },
}));

jest.mock('@/features/vocabulary/data/localPackCatalog', () => ({
  getLocalSituations: jest.fn(() => [
    {
      id: 'task-progress',
      title: 'Task & Progress',
      description: 'Status',
      learned: 0,
      total: 10,
    },
  ]),
  getLocalSituation: jest.fn((id: string) =>
    id === 'task-progress'
      ? {
          id: 'task-progress',
          title: 'Task & Progress',
          description: 'Status',
          learned: 0,
          total: 10,
        }
      : undefined,
  ),
  getLocalExpressions: jest.fn((slug: string) =>
    slug === 'task-progress'
      ? [
          {
            id: 'task-progress:blocker',
            text: 'blocker',
            tag: 'expression · A2',
            level: 'A2',
            pos: 'expr',
          },
        ]
      : [],
  ),
  getLocalExpressionTotal: jest.fn((slug: string) => (slug === 'task-progress' ? 10 : 0)),
  getLocalLevelTotals: jest.fn(() => ({ A2: 10 })),
  getLocalTerm: jest.fn((_situation: string, itemId: string) =>
    itemId === 'task-progress:blocker'
      ? {
          id: 'task-progress:blocker',
          situationId: 'task-progress',
          term: 'blocker',
          type: 'expression',
          pos: 'expr',
          level: 'A2',
          meaning: 'm',
          context: 'c',
          patterns: [],
          examples: [],
          alternatives: [],
          notes: [],
        }
      : undefined,
  ),
  getLocalSituationExercises: jest.fn((slug: string) =>
    slug === 'task-progress'
      ? [
          {
            id: 'ex1',
            situationId: 'task-progress',
            itemId: 'task-progress:blocker',
            type: 'choose_expression',
            prompt: 'x',
            payload: {
              options: [
                { id: 'a', text: 'A' },
                { id: 'b', text: 'B' },
              ],
            },
            answer: { optionId: 'a' },
            feedback: {
              expression: 'A',
              meaning: 'm',
              context: 'c',
              example: 'e',
              explanation: 'x',
            },
            sortOrder: 1,
            contentSchemaVersion: 1,
          },
        ]
      : [],
  ),
  getLocalCoreExpressions: jest.fn((slug: string) =>
    slug === 'task-progress'
      ? [
          {
            id: 'task-progress:blocker',
            text: 'blocker',
            tag: 'expression · A2',
            level: 'A2',
            pos: 'expr',
          },
        ]
      : [],
  ),
  getLocalCoreItemIds: jest.fn((slug: string) =>
    slug === 'task-progress' ? ['task-progress:blocker'] : [],
  ),
  searchLocalLibrary: jest.fn(() => ({
    items: [
      {
        id: 'task-progress:blocker',
        text: 'blocker',
        tag: 'expression · A2',
        level: 'A2',
        pos: 'expr',
        situationSlug: 'task-progress',
        situationTitle: 'Task & Progress',
      },
    ],
    total: 1,
  })),
}));

jest.mock('@/features/vocabulary/data/localSeedLoader', () => ({
  loadLocalPackCatalog: () =>
    Promise.resolve(
      jest.requireMock(
        '@/features/vocabulary/data/localPackCatalog',
      ) as typeof import('@/features/vocabulary/data/localPackCatalog'),
    ),
}));

jest.mock('@/features/vocabulary/data/weakProgressStore', () => ({
  loadWeakProgress: jest.fn(async () => {
    const map = new Map();
    map.set('task-progress:blocker', {
      itemId: 'task-progress:blocker',
      lastResult: false,
      incorrectCount: 2,
      correctCount: 0,
      lastSeenAt: '2026-01-01T00:00:00.000Z',
      sortOrder: 0,
    });
    return map;
  }),
  updateWeakProgress: jest.fn(async () => undefined),
}));

import {
  completeVocabularyAttempt,
  getExercisesForItemIds,
  getSituation,
  getSituationExercises,
  getSituationItems,
  getSituations,
  getVocabularyTerm,
  getWeakProgress,
  searchVocabularyLibrary,
} from '@/features/vocabulary/services/contentService';

describe('vocabulary contentService (local seed)', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockRpc.mockReset();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  it('uses local catalog when force-local is on', async () => {
    const situations = await getSituations();
    expect(situations[0]?.slug).toBe('task-progress');

    const situation = await getSituation('task-progress');
    expect(situation?.title).toBe('Task & Progress');
    await expect(getSituation('missing')).resolves.toBeNull();

    const exercises = await getSituationExercises('task-progress');
    expect(exercises).toHaveLength(1);
    await expect(getSituationExercises('missing')).rejects.toMatchObject({
      code: 'not_found',
    });

    const catalog = await getSituationItems('task-progress');
    expect(catalog?.items).toHaveLength(1);
    expect(catalog?.capped).toBe(true);
    await expect(getSituationItems('missing')).resolves.toBeNull();
    await expect(
      getVocabularyTerm('task-progress', 'task-progress:blocker'),
    ).resolves.toMatchObject({ term: 'blocker' });
    await expect(getVocabularyTerm('task-progress', 'missing')).resolves.toBeNull();

    const weak = await getWeakProgress('user-1');
    expect(weak[0]?.itemId).toBe('task-progress:blocker');
    await expect(getWeakProgress('')).rejects.toMatchObject({ code: 'unauthorized' });

    await completeVocabularyAttempt('user-1', {
      clientAttemptId: 'a1',
      situationId: 'task-progress',
      contentRevision: 1,
      correctCount: 1,
      totalCount: 1,
      score: 100,
      itemResults: [{ itemId: 'task-progress:blocker', correct: true }],
      startedAt: 'x',
      completedAt: 'y',
    });
    const { updateWeakProgress } = jest.requireMock(
      '@/features/vocabulary/data/weakProgressStore',
    ) as { updateWeakProgress: jest.Mock };
    expect(updateWeakProgress).toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loads local weak exercises across situation slugs from composite item ids', async () => {
    await expect(getExercisesForItemIds([])).resolves.toEqual([]);
    const exercises = await getExercisesForItemIds([
      'task-progress:blocker',
      'task-progress:blocker',
      'missing:item',
    ]);
    expect(exercises).toHaveLength(1);
    expect(exercises[0]?.itemId).toBe('task-progress:blocker');
  });

  it('searches the local library', async () => {
    const page = await searchVocabularyLibrary({ query: 'block' });
    expect(page.total).toBe(1);
    expect(page.items[0]?.text).toBe('blocker');
  });
});
