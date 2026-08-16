const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockGetUser = jest.fn(async () => ({
  data: { user: { id: 'user-1' } },
  error: null,
}));

jest.mock('@/app/config/env', () => ({
  VOCABULARY_FORCE_LOCAL_SEED: false,
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

jest.mock('@/features/vocabulary/data/localSeedLoader', () => ({
  loadLocalPackCatalog: () => {
    throw new Error('local catalog should not be used');
  },
}));

jest.mock('@/features/vocabulary/data/weakProgressStore', () => ({
  loadWeakProgress: jest.fn(async () => new Map()),
  updateWeakProgress: jest.fn(async () => undefined),
}));

import { VOCABULARY_REMOTE_PAGE_SIZE } from '@/features/vocabulary/data/catalogConstants';
import {
  completeVocabularyAttempt,
  deriveWeakClientAttemptId,
  getExercisesForItemIds,
  getSituation,
  getSituationExercises,
  getSituationItems,
  getSituations,
  getVocabularyTerm,
  getWeakProgress,
  searchVocabularyLibrary,
} from '@/features/vocabulary/services/contentService';

const ITEM_ROW = {
  id: 'item-uuid',
  situation_id: 'uuid-1',
  item_key: 'blocker',
  type: 'expression',
  term: 'blocker',
  meaning: 'm',
  context: 'c',
  level: 'A2',
  pos: 'n',
  content: {
    patterns: ['x'],
    examples: [['standup', 'I am blocked.']],
    alternatives: ['stuck'],
    notes: ['n'],
  },
  sort_order: 1,
  is_core: true,
  core_order: 1,
  pronunciation: '/ˈblɒkə/',
  countability: 'na',
};

function thenableQuery(result: { data: unknown; error: unknown }) {
  const promise = Promise.resolve(result);
  const query = {
    eq: () => query,
    or: () => query,
    in: () => query,
    order: () => query,
    limit: () => query,
    range: () => query,
    maybeSingle: () =>
      Promise.resolve({
        data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
        error: result.error,
      }),
    then: promise.then.bind(promise) as typeof promise.then,
  };
  return query;
}

function mockPublishedSituation() {
  return {
    select: () =>
      thenableQuery({
        data: [
          {
            id: 'uuid-1',
            slug: 'task-progress',
            title: 'Task & Progress',
            description: 'Status',
          },
        ],
        error: null,
      }),
  };
}

function mockVocabularyItems(selectImpl?: (cols?: string) => ReturnType<typeof thenableQuery>) {
  return {
    select: (cols?: string) => {
      if (selectImpl) {
        return selectImpl(cols);
      }
      if (cols === 'level') {
        return thenableQuery({ data: [{ level: 'A2' }], error: null });
      }
      if (cols === 'id, situation_id' || cols === 'id, situation_id, is_core') {
        return thenableQuery({
          data: [{ id: 'item-uuid', situation_id: 'uuid-1', is_core: true }],
          error: null,
        });
      }
      if (cols === 'id' || cols === 'id, is_core') {
        return thenableQuery({ data: [{ id: 'item-uuid', is_core: true }], error: null });
      }
      return thenableQuery({ data: [ITEM_ROW], error: null });
    },
  };
}

describe('vocabulary contentService (remote)', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockRpc.mockReset();
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });
  });

  it('reads remote situations/exercises/progress and completes via rpc', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return mockPublishedSituation();
      }
      if (table === 'vocabulary_items') {
        return mockVocabularyItems();
      }
      if (table === 'vocabulary_exercises') {
        return {
          select: () =>
            thenableQuery({
              data: [
                {
                  id: 'ex-uuid',
                  situation_id: 'uuid-1',
                  item_id: 'item-uuid',
                  exercise_key: 'blocker-ce',
                  type: 'choose_expression',
                  prompt: 'x',
                  payload: {
                    options: [
                      { id: 'a', text: 'A' },
                      { id: 'b', text: 'B' },
                    ],
                    correctOptionId: 'a',
                  },
                  feedback: {
                    expression: 'blocker',
                    meaning: 'm',
                    context: 'c',
                    example: 'e',
                    explanation: 'x',
                  },
                  content_schema_version: 1,
                  sort_order: 1,
                },
                {
                  id: 'bad',
                  situation_id: 'uuid-1',
                  item_id: 'item-uuid',
                  exercise_key: 'bad',
                  type: 'choose_expression',
                  prompt: 'x',
                  payload: { options: [{ id: 'a', text: 'A' }] },
                  feedback: {},
                  content_schema_version: 1,
                  sort_order: 2,
                },
              ],
              error: null,
            }),
        };
      }
      if (table === 'user_vocabulary_progress') {
        return {
          select: () => ({
            eq: async () => ({
              data: [
                {
                  item_id: 'item-1',
                  correct_count: 1,
                  incorrect_count: 2,
                  last_result: false,
                  last_seen_at: '2026-01-01T00:00:00.000Z',
                  vocabulary_items: { sort_order: 3, term: 'blocker' },
                },
              ],
              error: null,
            }),
          }),
        };
      }
      return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
    });

    const situations = await getSituations();
    expect(situations[0]?.total).toBe(1);
    expect(situations[0]?.itemIds).toEqual(['item-uuid']);

    const situation = await getSituation('task-progress');
    expect(situation?.id).toBe('uuid-1');

    const catalog = await getSituationItems('task-progress');
    expect(catalog?.items[0]?.text).toBe('blocker');
    expect(catalog?.capped).toBe(false);
    await expect(
      getVocabularyTerm('task-progress', 'task-progress:blocker'),
    ).resolves.toMatchObject({ term: 'blocker', situationId: 'task-progress' });
    await expect(getVocabularyTerm('task-progress', 'blocker')).resolves.toMatchObject({
      term: 'blocker',
    });
    await expect(
      getVocabularyTerm('task-progress', '550e8400-e29b-41d4-a716-446655440000'),
    ).resolves.toMatchObject({ id: 'item-uuid' });

    const exercises = await getSituationExercises('task-progress');
    expect(exercises).toHaveLength(1);
    expect(exercises[0]?.id).toBe('ex-uuid');

    const weak = await getWeakProgress('user-1');
    expect(weak[0]?.sortOrder).toBe(3);
    expect(weak[0]?.term).toBe('blocker');

    mockRpc.mockResolvedValueOnce({ error: null });
    await completeVocabularyAttempt('user-1', {
      clientAttemptId: 'a1',
      situationId: 'uuid-1',
      contentRevision: 1,
      correctCount: 1,
      totalCount: 1,
      score: 100,
      itemResults: [{ itemId: 'item-1', correct: true }],
      startedAt: 'x',
      completedAt: 'y',
    });
    expect(mockRpc).toHaveBeenCalled();

    (mockGetUser as jest.Mock).mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(
      completeVocabularyAttempt('user-1', {
        clientAttemptId: 'a1',
        situationId: 'uuid-1',
        contentRevision: 1,
        correctCount: 1,
        totalCount: 1,
        score: 100,
        itemResults: [],
        startedAt: 'x',
        completedAt: 'y',
      }),
    ).rejects.toMatchObject({ code: 'unauthorized' });

    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'other' } },
      error: null,
    });
    await expect(
      completeVocabularyAttempt('user-1', {
        clientAttemptId: 'a1',
        situationId: 'uuid-1',
        contentRevision: 1,
        correctCount: 1,
        totalCount: 1,
        score: 100,
        itemResults: [],
        startedAt: 'x',
        completedAt: 'y',
      }),
    ).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('looks up a situation by slug or uuid without mixing columns in or()', async () => {
    const filters: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return {
          select: () => ({
            eq: (column: string, value: string) => {
              filters.push(`${column}:${value}`);
              return {
                eq: (column2: string, value2: string) => {
                  filters.push(`${column2}:${value2}`);
                  return {
                    maybeSingle: async () => ({
                      data: {
                        id: 'uuid-1',
                        slug: 'task-progress',
                        title: 'Task & Progress',
                        description: 'Status',
                      },
                      error: null,
                    }),
                  };
                },
              };
            },
          }),
        };
      }
      if (table === 'vocabulary_items') {
        return mockVocabularyItems();
      }
      throw new Error(`unexpected table ${table}`);
    });

    await expect(getSituation('task-progress')).resolves.toMatchObject({ id: 'uuid-1' });
    expect(filters).toEqual(['published:true', 'slug:task-progress']);

    filters.length = 0;
    await expect(getSituation('550e8400-e29b-41d4-a716-446655440000')).resolves.toMatchObject({
      slug: 'task-progress',
    });
    expect(filters).toEqual(['published:true', 'id:550e8400-e29b-41d4-a716-446655440000']);
  });

  it('pages remote item ids past PostgREST max_rows', async () => {
    const page1 = Array.from({ length: VOCABULARY_REMOTE_PAGE_SIZE }, (_, index) => ({
      id: `id-${index}`,
      situation_id: 'uuid-1',
    }));
    const page2 = [
      { id: 'id-extra-1', situation_id: 'uuid-1' },
      { id: 'id-extra-2', situation_id: 'uuid-1' },
    ];
    let rangeCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return mockPublishedSituation();
      }
      if (table === 'vocabulary_items') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                range: (from: number) => {
                  rangeCalls += 1;
                  return thenableQuery({
                    data: from === 0 ? page1 : page2,
                    error: null,
                  });
                },
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    const situations = await getSituations();
    expect(rangeCalls).toBe(2);
    expect(situations[0]?.total).toBe(VOCABULARY_REMOTE_PAGE_SIZE + page2.length);
  });

  it('loads weak exercises by UUID item ids without slug splitting', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_exercises') {
        return {
          select: () =>
            thenableQuery({
              data: [
                {
                  id: 'ex-uuid',
                  situation_id: 'uuid-1',
                  item_id: 'item-uuid',
                  exercise_key: 'blocker-ce',
                  type: 'choose_expression',
                  prompt: 'x',
                  payload: {
                    options: [
                      { id: 'a', text: 'A' },
                      { id: 'b', text: 'B' },
                    ],
                    correctOptionId: 'a',
                  },
                  feedback: {
                    expression: 'blocker',
                    meaning: 'm',
                    context: 'c',
                    example: 'e',
                    explanation: 'x',
                  },
                  content_schema_version: 1,
                  sort_order: 1,
                  vocabulary_situations: { slug: 'task-progress' },
                },
                {
                  id: 'other',
                  situation_id: 'uuid-2',
                  item_id: 'other-uuid',
                  exercise_key: 'x',
                  type: 'choose_expression',
                  prompt: 'x',
                  payload: {
                    options: [
                      { id: 'a', text: 'A' },
                      { id: 'b', text: 'B' },
                    ],
                    correctOptionId: 'a',
                  },
                  feedback: {
                    expression: 'x',
                    meaning: 'm',
                    context: 'c',
                    example: 'e',
                    explanation: 'x',
                  },
                  content_schema_version: 1,
                  sort_order: 2,
                  vocabulary_situations: [{ slug: 'code-review' }],
                },
                {
                  id: 'noslug',
                  situation_id: 'uuid-3',
                  item_id: 'item-uuid',
                  exercise_key: 'y',
                  type: 'choose_expression',
                  prompt: 'x',
                  payload: {
                    options: [
                      { id: 'a', text: 'A' },
                      { id: 'b', text: 'B' },
                    ],
                    correctOptionId: 'a',
                  },
                  feedback: {
                    expression: 'y',
                    meaning: 'm',
                    context: 'c',
                    example: 'e',
                    explanation: 'x',
                  },
                  content_schema_version: 1,
                  sort_order: 3,
                  vocabulary_situations: null,
                },
              ],
              error: null,
            }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    await expect(getExercisesForItemIds([])).resolves.toEqual([]);
    const exercises = await getExercisesForItemIds(['item-uuid']);
    expect(exercises).toHaveLength(1);
    expect(exercises[0]?.itemId).toBe('item-uuid');
    expect(exercises[0]?.id).toBe('ex-uuid');
  });

  it('maps remote weak-exercise query failures and skips unmappable rows', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_exercises') {
        return {
          select: () => thenableQuery({ data: null, error: { message: 'down' } }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    await expect(getExercisesForItemIds(['item-uuid'])).rejects.toMatchObject({
      code: 'unavailable',
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_exercises') {
        return {
          select: () =>
            thenableQuery({
              data: [
                {
                  id: 'bad',
                  situation_id: 'uuid-1',
                  item_id: 'item-uuid',
                  exercise_key: 'bad',
                  type: 'choose_expression',
                  prompt: 'x',
                  payload: { options: [{ id: 'a', text: 'A' }] },
                  feedback: null,
                  content_schema_version: 1,
                  sort_order: 1,
                  vocabulary_situations: { slug: 'task-progress' },
                },
                {
                  id: 'empty-sit',
                  situation_id: 'uuid-1',
                  item_id: 'item-uuid',
                  exercise_key: 'empty',
                  type: 'choose_expression',
                  prompt: 'x',
                  payload: {
                    options: [
                      { id: 'a', text: 'A' },
                      { id: 'b', text: 'B' },
                    ],
                    correctOptionId: 'a',
                  },
                  feedback: { expression: 'x' },
                  content_schema_version: 1,
                  sort_order: 2,
                  vocabulary_situations: [],
                },
              ],
              error: null,
            }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    await expect(getExercisesForItemIds(['item-uuid'])).resolves.toEqual([]);
  });

  it('maps remote weak progress when vocabulary_items is an array', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_vocabulary_progress') {
        return {
          select: () => ({
            eq: async () => ({
              data: [
                {
                  item_id: 'item-arr',
                  correct_count: 0,
                  incorrect_count: 2,
                  last_result: 'incorrect',
                  last_seen_at: '2024-01-01',
                  vocabulary_items: [{ sort_order: 7 }],
                },
                {
                  item_id: 'item-null',
                  correct_count: 0,
                  incorrect_count: 1,
                  last_result: 'incorrect',
                  last_seen_at: '2024-01-02',
                  vocabulary_items: null,
                },
              ],
              error: null,
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    const weak = await getWeakProgress('user-1');
    expect(weak.find((row) => row.itemId === 'item-arr')?.sortOrder).toBe(7);
    expect(weak.find((row) => row.itemId === 'item-null')?.sortOrder).toBe(0);
  });

  it('maps remote failures to unavailable', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: null, error: { message: 'down' } }),
        }),
      }),
    });
    await expect(getSituations()).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('throws not_found when remote situation missing for exercises', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
    await expect(getSituationExercises('missing')).rejects.toMatchObject({ code: 'not_found' });
    await expect(getSituationItems('missing')).resolves.toBeNull();
    await expect(getVocabularyTerm('missing', 'item')).resolves.toBeNull();
  });

  it('maps remote situation/progress/rpc failures', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: { message: 'down' } }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: async () => ({ data: null, error: { message: 'down' } }),
        }),
      };
    });
    await expect(getSituation('x')).rejects.toMatchObject({ code: 'unavailable' });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_vocabulary_progress') {
        return {
          select: () => ({
            eq: async () => ({ data: null, error: { message: 'down' } }),
          }),
        };
      }
      return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
    });
    await expect(getWeakProgress('user-1')).rejects.toMatchObject({ code: 'unavailable' });

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockRpc.mockResolvedValueOnce({ error: { message: 'rpc failed' } });
    await expect(
      completeVocabularyAttempt('user-1', {
        clientAttemptId: 'a1',
        situationId: 'uuid-1',
        contentRevision: 1,
        correctCount: 1,
        totalCount: 1,
        score: 100,
        itemResults: [],
        startedAt: 'x',
        completedAt: 'y',
      }),
    ).rejects.toMatchObject({ code: 'unavailable' });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [
                  {
                    id: 'uuid-1',
                    slug: 'task-progress',
                    title: 'Task & Progress',
                    description: 'Status',
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_items') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                range: async () => ({ data: null, error: { message: 'count fail' } }),
              }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
    });
    await expect(getSituations()).rejects.toMatchObject({ code: 'unavailable' });

    await expect(
      completeVocabularyAttempt('', {
        clientAttemptId: 'a1',
        situationId: 'uuid-1',
        contentRevision: 1,
        correctCount: 1,
        totalCount: 1,
        score: 100,
        itemResults: [],
        startedAt: 'x',
        completedAt: 'y',
      }),
    ).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('maps remote catalog browse failures and empty term rows', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return mockPublishedSituation();
      }
      if (table === 'vocabulary_items') {
        return {
          select: (cols?: string) => {
            if (cols?.includes('item_key, type, term')) {
              return thenableQuery({ data: null, error: { message: 'items fail' } });
            }
            return thenableQuery({ data: [{ id: 'item-uuid' }], error: null });
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    await expect(getSituationItems('task-progress')).rejects.toMatchObject({
      code: 'unavailable',
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return mockPublishedSituation();
      }
      if (table === 'vocabulary_items') {
        return {
          select: (cols?: string) => {
            if (cols === 'id' || cols === 'id, is_core') {
              return thenableQuery({
                data: [{ id: 'a' }, { id: 'b' }],
                error: null,
              });
            }
            if (cols === 'level') {
              return thenableQuery({ data: [{ level: 'A2' }, { level: 'A2' }], error: null });
            }
            return thenableQuery({ data: [ITEM_ROW], error: null });
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    const capped = await getSituationItems('task-progress');
    expect(capped?.capped).toBe(true);
    expect(capped?.total).toBe(2);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return mockPublishedSituation();
      }
      if (table === 'vocabulary_items') {
        return {
          select: () => thenableQuery({ data: [], error: null }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    await expect(getVocabularyTerm('task-progress', 'missing')).resolves.toBeNull();

    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return mockPublishedSituation();
      }
      if (table === 'vocabulary_items') {
        return {
          select: () => thenableQuery({ data: null, error: { message: 'term fail' } }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    await expect(getVocabularyTerm('task-progress', 'item-uuid')).rejects.toMatchObject({
      code: 'unavailable',
    });
  });

  it('splits weak completions across situation UUIDs', async () => {
    mockRpc.mockResolvedValue({ error: null });
    await completeVocabularyAttempt('user-1', {
      clientAttemptId: '11111111-1111-4111-8111-111111111111',
      situationId: 'weak',
      contentRevision: 1,
      correctCount: 1,
      totalCount: 2,
      score: 50,
      itemResults: [
        { itemId: 'item-a', correct: true, situationId: 'sit-a' },
        { itemId: 'item-b', correct: false, situationId: 'sit-b' },
      ],
      startedAt: 'x',
      completedAt: 'y',
    });
    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc).toHaveBeenCalledWith(
      'complete_vocabulary_attempt',
      expect.objectContaining({
        p_client_attempt_id: deriveWeakClientAttemptId(
          '11111111-1111-4111-8111-111111111111',
          'sit-a',
        ),
        p_situation_id: 'sit-a',
        p_correct_count: 1,
        p_total_count: 1,
        p_score: 100,
      }),
    );
    expect(mockRpc).toHaveBeenCalledWith(
      'complete_vocabulary_attempt',
      expect.objectContaining({
        p_situation_id: 'sit-b',
        p_correct_count: 0,
        p_total_count: 1,
        p_score: 0,
      }),
    );

    await expect(
      completeVocabularyAttempt('user-1', {
        clientAttemptId: '11111111-1111-4111-8111-111111111111',
        situationId: 'weak',
        contentRevision: 1,
        correctCount: 0,
        totalCount: 1,
        score: 0,
        itemResults: [{ itemId: 'item-a', correct: false }],
        startedAt: 'x',
        completedAt: 'y',
      }),
    ).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('searches the remote library with situation and CEFR filters', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return mockPublishedSituation();
      }
      if (table === 'vocabulary_items') {
        return {
          select: () => {
            const query = thenableQuery({
              data: [
                {
                  ...ITEM_ROW,
                  vocabulary_situations: [{ slug: 'task-progress', title: 'Task & Progress' }],
                },
              ],
              error: null,
              count: 1,
            });
            return {
              ...query,
              eq: () => query,
              or: () => query,
              order: () => query,
              range: () => query,
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const page = await searchVocabularyLibrary({
      query: 'block',
      level: 'A2',
    });
    expect(page.total).toBe(1);
    expect(page.items[0]?.text).toBe('blocker');
    expect(page.items[0]?.situationSlug).toBe('task-progress');
  });

  it('returns an empty library page when the situation filter is unknown', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return {
          select: () => thenableQuery({ data: null, error: null }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });
    await expect(
      searchVocabularyLibrary({ situationSlug: 'missing', query: '%%%' }),
    ).resolves.toEqual({
      items: [],
      total: 0,
      offset: 0,
      limit: 40,
    });
  });
});
