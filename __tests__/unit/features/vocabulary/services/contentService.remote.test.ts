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

jest.mock('@/features/vocabulary/data/localPackCatalog', () => ({
  getLocalSituations: jest.fn(() => {
    throw new Error('local catalog should not be used');
  }),
  getLocalSituation: jest.fn(() => {
    throw new Error('local catalog should not be used');
  }),
  getLocalSituationExercises: jest.fn(() => {
    throw new Error('local catalog should not be used');
  }),
}));

jest.mock('@/features/vocabulary/data/weakProgressStore', () => ({
  loadWeakProgress: jest.fn(async () => new Map()),
  updateWeakProgress: jest.fn(async () => undefined),
}));

import {
  completeVocabularyAttempt,
  getSituation,
  getSituationExercises,
  getSituations,
  getWeakProgress,
} from '@/features/vocabulary/services/contentService';

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
              or: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'uuid-1',
                    slug: 'task-progress',
                    title: 'Task & Progress',
                    description: 'Status',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_items') {
        return {
          select: () => ({
            eq: () => ({
              eq: async () => ({ count: 12, error: null }),
            }),
          }),
        };
      }
      if (table === 'vocabulary_exercises') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: async () => ({
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
              }),
            }),
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
                  vocabulary_items: { sort_order: 3 },
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
    expect(situations[0]?.total).toBe(12);

    const situation = await getSituation('task-progress');
    expect(situation?.id).toBe('uuid-1');

    const exercises = await getSituationExercises('task-progress');
    expect(exercises).toHaveLength(1);
    expect(exercises[0]?.id).toBe('ex-uuid');

    const weak = await getWeakProgress('user-1');
    expect(weak[0]?.sortOrder).toBe(3);

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
          or: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
    await expect(getSituationExercises('missing')).rejects.toMatchObject({ code: 'not_found' });
  });

  it('maps remote situation/progress/rpc failures', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'vocabulary_situations') {
        return {
          select: () => ({
            eq: () => ({
              or: () => ({
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
              eq: async () => ({ count: null, error: { message: 'count fail' } }),
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
});
