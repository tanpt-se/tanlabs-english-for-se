const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockGetUser = jest.fn(async () => ({
  data: { user: { id: 'user-1' } },
  error: null,
}));

jest.mock('@/core/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  },
}));

jest.mock('@/core/monitoring/crashlytics', () => ({
  recordError: jest.fn(async () => undefined),
}));

import {
  completeGrammarAttempt,
  getAllPublishedLessons,
  getExercisesByLesson,
  getGrammarAttemptByClientId,
  getLesson,
  getLessonProgress,
  getLessonsByTopic,
  getProgressForUser,
  getTopic,
  getTopics,
} from '@/features/grammar/services';

import { FIXTURE_LESSON } from '../../../../helpers/grammarFixtures';

const topicRow = {
  id: 't1',
  slug: 'present-simple',
  title: 'Present Simple',
  description: 'Habits',
  sort_order: 1,
  published: true,
};

function lessonRow() {
  const lesson = FIXTURE_LESSON;
  return {
    id: 'l1',
    topic_id: 't1',
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    level: lesson.level,
    content: lesson.content,
    content_schema_version: 1,
    content_revision: 1,
    sort_order: 1,
    published: true,
  };
}

const exerciseRow = {
  id: 'e1',
  topic_id: 't1',
  lesson_id: 'l1',
  exercise_key: 'ps-x1',
  type: 'multiple_choice',
  prompt: 'Choose',
  payload: {
    options: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
  },
  answer: { optionId: 'a' },
  explanation: 'Because',
  content_schema_version: 1,
  sort_order: 1,
  published: true,
};

const progressRow = {
  lesson_id: 'l1',
  topic_id: 't1',
  status: 'completed',
  best_score: 80,
  last_score: 70,
  last_activity_at: '2026-08-11T00:00:00Z',
  completed_at: '2026-08-11T00:00:00Z',
};

function orderedQuery(result: { data: unknown; error: unknown }) {
  return {
    select: () => ({
      eq: () => ({
        order: async () => result,
        eq: () => ({
          order: async () => result,
          maybeSingle: async () => ({
            data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
            error: result.error,
          }),
        }),
        maybeSingle: async () => ({
          data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
          error: result.error,
        }),
      }),
    }),
  };
}

function progressQuery(list: unknown[], single: unknown | null = list[0] ?? null) {
  return {
    select: () => ({
      eq: () => {
        const secondEq = {
          eq: () => ({
            maybeSingle: async () => ({ data: single, error: null }),
          }),
          then(
            onFulfilled: (value: { data: unknown; error: null }) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) {
            return Promise.resolve({ data: list, error: null }).then(onFulfilled, onRejected);
          },
        };
        return secondEq;
      },
    }),
  };
}

describe('grammar contentService', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockRpc.mockReset();
  });

  it('returns published topics and skips invalid rows', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'grammar_topics') {
        return orderedQuery({
          data: [topicRow, { ...topicRow, id: 'bad', slug: 'nope' }],
          error: null,
        });
      }
      return {
        select: () => ({
          eq: async () => ({ data: [{ topic_id: 't1' }], error: null }),
        }),
      };
    });

    const topics = await getTopics();
    expect(topics).toHaveLength(1);
    expect(topics[0].slug).toBe('present-simple');
    expect(topics[0].lessonCount).toBe(1);
  });

  it('maps missing topic to not_found and network errors to unavailable', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
    await expect(getTopic('missing')).rejects.toMatchObject({ code: 'not_found' });

    mockFrom.mockReturnValue(
      orderedQuery({
        data: null,
        error: { message: 'down' },
      }),
    );
    await expect(getTopics()).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('handles topic lesson-count head query success and failure', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'grammar_topics') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: topicRow, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: async () => ({ count: 4, error: null }),
          }),
        }),
      };
    });
    const topic = await getTopic('t1');
    expect(topic.lessonCount).toBe(4);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'grammar_topics') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: topicRow, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: async () => ({ count: null, error: { message: 'down' } }),
          }),
        }),
      };
    });
    await expect(getTopic('t1')).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('maps topic lesson count transport errors to unavailable', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'grammar_topics') {
        return orderedQuery({
          data: [topicRow],
          error: null,
        });
      }
      return {
        select: () => ({
          eq: async () => ({ data: null, error: { message: 'down' } }),
        }),
      };
    });
    await expect(getTopics()).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('loads lessons, lesson detail, and exercises', async () => {
    const row = lessonRow();
    mockFrom.mockImplementation((table: string) => {
      if (table === 'grammar_lessons') {
        return orderedQuery({
          data: [
            row,
            {
              ...row,
              id: 'bad',
              slug: 'bad',
              content_schema_version: 99,
            },
          ],
          error: null,
        });
      }
      if (table === 'grammar_exercises') {
        return orderedQuery({
          data: [
            exerciseRow,
            {
              ...exerciseRow,
              id: 'bad-e',
              content_schema_version: 99,
            },
          ],
          error: null,
        });
      }
      return orderedQuery({ data: [], error: null });
    });

    expect(await getLessonsByTopic('t1')).toHaveLength(1);
    expect((await getLesson('l1')).slug).toBe(row.slug);
    expect(await getExercisesByLesson('l1')).toHaveLength(1);
  });

  it('loads progress and rejects empty user id', async () => {
    mockFrom.mockReturnValue(progressQuery([progressRow], progressRow));

    expect(await getProgressForUser('user-1')).toHaveLength(1);
    expect(await getLessonProgress('user-1', 'l1')).toMatchObject({ status: 'completed' });

    mockFrom.mockReturnValue(progressQuery([], null));
    expect(await getLessonProgress('user-1', 'missing')).toBeNull();

    await expect(getProgressForUser('')).rejects.toMatchObject({ code: 'unauthorized' });
    await expect(getLessonProgress('', 'l1')).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('skips invalid progress rows and surfaces lesson/topic transport errors', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          then(
            onFulfilled: (value: { data: unknown; error: null }) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) {
            return Promise.resolve({
              data: [
                progressRow,
                {
                  ...progressRow,
                  status: 'weird',
                },
              ],
              error: null,
            }).then(onFulfilled, onRejected);
          },
          eq: () => ({
            maybeSingle: async () => ({
              data: null,
              error: { message: 'down' },
            }),
          }),
        }),
      }),
    });

    expect(await getProgressForUser('user-1')).toHaveLength(1);
    await expect(getLessonProgress('user-1', 'l1')).rejects.toMatchObject({
      code: 'unavailable',
    });

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: { message: 'down' } }),
            order: async () => ({ data: null, error: { message: 'down' } }),
          }),
          order: async () => ({ data: null, error: { message: 'down' } }),
        }),
      }),
    });
    await expect(getLesson('l1')).rejects.toMatchObject({ code: 'unavailable' });
    await expect(getLessonsByTopic('t1')).rejects.toMatchObject({ code: 'unavailable' });
    await expect(getExercisesByLesson('l1')).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('maps not_found for missing lesson and getTopic success path', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
    await expect(getLesson('missing')).rejects.toMatchObject({ code: 'not_found' });

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: topicRow, error: null }),
          }),
        }),
      }),
    });
    expect((await getTopic('t1')).slug).toBe('present-simple');
  });

  it('loads all published lessons for continue learning', async () => {
    const row = lessonRow();
    mockFrom.mockReturnValue(
      orderedQuery({
        data: [row, { ...row, id: 'bad', content_schema_version: 99 }],
        error: null,
      }),
    );

    const lessons = await getAllPublishedLessons();
    expect(lessons).toHaveLength(1);
    expect(lessons[0]?.id).toBe('l1');
  });

  it('maps all-lessons transport errors to unavailable', async () => {
    mockFrom.mockReturnValue(
      orderedQuery({
        data: null,
        error: { message: 'down' },
      }),
    );
    await expect(getAllPublishedLessons()).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('loads grammar attempts by client id and rejects missing user', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                client_attempt_id: 'attempt-1',
                topic_id: 't1',
                lesson_id: 'l1',
                content_revision: 1,
                correct_count: 7,
                total_count: 10,
                score: 70,
                answers: [],
                started_at: '2026-08-12T00:00:00Z',
                completed_at: '2026-08-12T00:01:00Z',
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const attempt = await getGrammarAttemptByClientId('user-1', 'attempt-1');
    expect(attempt?.clientAttemptId).toBe('attempt-1');
    expect(attempt?.score).toBe(70);

    await expect(getGrammarAttemptByClientId('', 'attempt-1')).rejects.toMatchObject({
      code: 'unauthorized',
    });
  });

  it('returns null or unavailable when attempt lookup is empty/error', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
    await expect(getGrammarAttemptByClientId('user-1', 'missing')).resolves.toBeNull();

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: { message: 'down' } }),
          }),
        }),
      }),
    });
    await expect(getGrammarAttemptByClientId('user-1', 'missing')).rejects.toMatchObject({
      code: 'unavailable',
    });
  });

  it('persists attempts through complete_grammar_attempt RPC', async () => {
    mockRpc.mockResolvedValue({ error: null });

    await completeGrammarAttempt('user-1', {
      clientAttemptId: 'attempt-1',
      topicId: 't1',
      lessonId: 'l1',
      contentRevision: 1,
      correctCount: 7,
      totalCount: 10,
      score: 70,
      answers: [{ exerciseId: 'e1', correct: true }],
      startedAt: '2026-08-12T00:00:00Z',
      completedAt: '2026-08-12T00:01:00Z',
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'complete_grammar_attempt',
      expect.objectContaining({
        p_client_attempt_id: 'attempt-1',
        p_score: 70,
      }),
    );

    await expect(
      completeGrammarAttempt('', {
        clientAttemptId: 'attempt-1',
        topicId: 't1',
        lessonId: 'l1',
        contentRevision: 1,
        correctCount: 7,
        totalCount: 10,
        score: 70,
        answers: [],
        startedAt: '2026-08-12T00:00:00Z',
        completedAt: '2026-08-12T00:01:00Z',
      }),
    ).rejects.toMatchObject({ code: 'unauthorized' });
  });

  it('maps RPC errors to unavailable on complete attempt', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'down' } });
    await expect(
      completeGrammarAttempt('user-1', {
        clientAttemptId: 'attempt-1',
        topicId: 't1',
        lessonId: 'l1',
        contentRevision: 1,
        correctCount: 7,
        totalCount: 10,
        score: 70,
        answers: [],
        startedAt: '2026-08-12T00:00:00Z',
        completedAt: '2026-08-12T00:01:00Z',
      }),
    ).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('maps topic/lesson/exercise parser failures to not_found when no valid rows remain', async () => {
    mockFrom.mockReturnValue(
      orderedQuery({
        data: [
          {
            ...topicRow,
            slug: 'bad-slug',
          },
        ],
        error: null,
      }),
    );
    await expect(getTopic('t1')).rejects.toMatchObject({ code: 'invalid_content' });

    const row = lessonRow();
    mockFrom.mockImplementation((table: string) => {
      if (table === 'grammar_lessons') {
        return orderedQuery({
          data: [{ ...row, content_schema_version: 99 }],
          error: null,
        });
      }
      return orderedQuery({
        data: [{ ...exerciseRow, content_schema_version: 99 }],
        error: null,
      });
    });
    await expect(getLesson('l1')).rejects.toMatchObject({ code: 'invalid_content' });
    await expect(getExercisesByLesson('l1')).resolves.toEqual([]);
  });
});
