jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}));

jest.mock('@/app/config/env', () => ({
  GRAMMAR_FORCE_LOCAL_SEED: true,
  isDevelopment: true,
  isProduction: false,
  APP_ENV: 'development',
}));

jest.mock('@/core/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => {
      throw new Error('Supabase should not be called when GRAMMAR_FORCE_LOCAL_SEED is on');
    }),
    auth: {
      getUser: jest.fn(async () => ({
        data: { user: { id: 'user-1' } },
        error: null,
      })),
    },
  },
}));

jest.mock('@/core/monitoring/crashlytics', () => ({
  recordError: jest.fn(async () => undefined),
}));

jest.mock('@/features/grammar/services/localSeedLoader', () => ({
  loadLocalSeedCatalog: () =>
    Promise.resolve(
      jest.requireActual(
        '@/features/grammar/services/localSeedCatalog',
      ) as typeof import('@/features/grammar/services/localSeedCatalog'),
    ),
}));

import {
  completeGrammarAttempt,
  getExercisesByLesson,
  getLesson,
  getLessonProgress,
  getLessonsByTopic,
  getProgressForUser,
  getTopic,
  getTopics,
} from '@/features/grammar/services';
import {
  buildLocalSeedCatalogForTests,
  getLocalLessonProgress,
  getLocalLesson,
  getLocalTopic,
  listAllLocalLessons,
  listLocalExercisesByLesson,
  listLocalLessonsByTopic,
  listLocalProgress,
  listLocalTopics,
  recordLocalProgressAttempt,
  resetLocalProgressForTests,
  resetLocalSeedCatalogForTests,
} from '@/features/grammar/services/localSeedCatalog';

const validLesson = {
  key: 'a2',
  level: 'A2' as const,
  title: 'A2 · Habits',
  description: 'Habits and facts. Cue: every / usually / still.',
  usage: 'When: habits, ownership, facts that stay true. Cue: every, usually, still.',
  forms: {
    affirmative: 'I/you/we/they + V',
    negative: "don't + V",
    question: 'Do + subject + V?',
  },
  exampleSentences: [
    ['a', 'I ship small fixes every morning.'],
    ['b', 'This service retries failed jobs.'],
    ['c', 'She owns the payment webhook.'],
    ['d', 'Nightly backups finish before dawn.'],
    ['e', 'We review pull requests on Fridays.'],
  ],
  tips: ['Add -s for he/she/it.'],
};

const AsyncStorageMock = jest.requireMock('@react-native-async-storage/async-storage') as {
  getItem: jest.Mock;
  setItem: jest.Mock;
};

describe('grammar local packs preview', () => {
  beforeEach(() => {
    resetLocalSeedCatalogForTests();
    resetLocalProgressForTests();
    AsyncStorageMock.getItem.mockReset();
    AsyncStorageMock.getItem.mockResolvedValue(null);
    AsyncStorageMock.setItem.mockReset();
    AsyncStorageMock.setItem.mockResolvedValue(undefined);
  });

  it('serves shared topics with A2–C1 lessons without calling Supabase', async () => {
    const topics = await getTopics();
    expect(topics).toHaveLength(13);
    expect(topics.map((topic) => topic.slug)).toEqual([
      'present-simple',
      'present-continuous',
      'past-simple',
      'present-perfect',
      'future-forms',
      'modals',
      'conditionals',
      'passives',
      'articles',
      'reported-speech',
      'present-perfect-continuous',
      'verb-patterns',
      'connectors',
    ]);

    const topic = await getTopic(topics[0].id);
    expect(topic.slug).toBe('present-simple');

    const lessons = await getLessonsByTopic(topic.id);
    expect(lessons).toHaveLength(4);
    expect(new Set(lessons.map((row) => row.level))).toEqual(new Set(['A2', 'B1', 'B2', 'C1']));
    expect(lessons.filter((row) => row.level === 'A2').map((row) => row.title)).toEqual([
      'A2 · Habits',
    ]);
    expect(lessons[0].description).toMatch(/habits/i);

    const a2 = lessons.find((row) => row.slug === 'present-simple-a2');
    expect(a2).toBeTruthy();
    const lesson = await getLesson(a2!.id);
    expect(lesson.level).toBe('A2');

    const exercises = await getExercisesByLesson(lesson.id);
    expect(exercises).toHaveLength(18);
    expect(new Set(exercises.map((row) => row.type))).toEqual(
      new Set(['multiple_choice', 'fill_blank', 'sentence_order']),
    );

    expect(await getProgressForUser('user-1')).toEqual([]);
    expect(await getLessonProgress('user-1', lesson.id)).toBeNull();

    await completeGrammarAttempt('user-1', {
      clientAttemptId: '11111111-1111-4111-8111-111111111111',
      topicId: topic.id,
      lessonId: lesson.id,
      contentRevision: 1,
      correctCount: 16,
      totalCount: 18,
      score: 89,
      answers: [],
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:10:00.000Z',
    });
    expect(await getLessonProgress('user-1', lesson.id)).toMatchObject({
      bestScore: 89,
      status: 'completed',
    });
    expect(await getProgressForUser('user-1')).toHaveLength(1);

    await expect(getProgressForUser('')).rejects.toMatchObject({ code: 'unauthorized' });
    await expect(getLessonProgress('', lesson.id)).rejects.toMatchObject({ code: 'unauthorized' });
    await expect(getTopic('missing-topic')).rejects.toMatchObject({ code: 'not_found' });
    await expect(getLesson('missing-lesson')).rejects.toMatchObject({ code: 'not_found' });
    await expect(getLessonsByTopic('missing-topic')).rejects.toMatchObject({ code: 'not_found' });
    await expect(getExercisesByLesson('missing-lesson')).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('rejects invalid pack shapes while building the preview catalog', () => {
    expect(() =>
      buildLocalSeedCatalogForTests([
        {
          slug: 'not-a-real-slug',
          title: 'Bad',
          description: 'Bad',
          sortOrder: 1,
          lessons: [],
          exercises: [],
        },
      ]),
    ).toThrow(/Unsupported preview slug/);

    expect(() =>
      buildLocalSeedCatalogForTests([
        {
          slug: 'present-simple',
          title: 'Present Simple',
          description: 'Habits for software teams in standups.',
          sortOrder: 1,
          lessons: [
            {
              ...validLesson,
              exampleSentences: [
                ['a', 'one'],
                ['b', 'two'],
              ],
            },
          ],
          exercises: [],
        },
      ]),
    ).toThrow(/Preview lesson/);

    expect(() =>
      buildLocalSeedCatalogForTests([
        {
          slug: 'present-simple',
          title: 'Present Simple',
          description: 'Habits for software teams in standups.',
          sortOrder: 1,
          lessons: [validLesson],
          exercises: [
            {
              id: 'bad-ex',
              lessonKey: 'missing',
              type: 'multiple_choice',
              prompt: 'Choose',
              explanation: 'Because',
              payload: {
                options: [
                  { id: 'a', label: 'A' },
                  { id: 'b', label: 'B' },
                ],
              },
              answer: { optionId: 'a' },
            },
          ],
        },
      ]),
    ).toThrow(/unknown lessonKey/);

    expect(() =>
      buildLocalSeedCatalogForTests([
        {
          slug: 'present-simple',
          title: 'Present Simple',
          description: 'Habits for software teams in standups.',
          sortOrder: 1,
          lessons: [validLesson],
          exercises: [
            {
              id: 'bad-ex',
              lessonKey: 'a2',
              type: 'multiple_choice',
              prompt: 'Choose',
              explanation: 'Because',
              payload: { options: [{ id: 'a', label: 'A' }] },
              answer: { optionId: 'a' },
            },
          ],
        },
      ]),
    ).toThrow(/Preview exercise/);
  });

  it('exposes local catalog accessors and not_found guards', async () => {
    const topics = listLocalTopics();
    expect(topics.length).toBeGreaterThan(0);
    const firstTopic = topics[0]!;

    const lessons = listLocalLessonsByTopic(firstTopic.id);
    expect(lessons.length).toBeGreaterThan(0);
    const firstLesson = lessons[0]!;

    expect(getLocalTopic(firstTopic.id).id).toBe(firstTopic.id);
    expect(getLocalLesson(firstLesson.id).id).toBe(firstLesson.id);
    expect(listLocalExercisesByLesson(firstLesson.id).length).toBeGreaterThan(0);
    expect(listAllLocalLessons().some((row) => row.id === firstLesson.id)).toBe(true);

    expect(() => getLocalTopic('missing-topic')).toThrow(/Topic not found/);
    expect(() => listLocalLessonsByTopic('missing-topic')).toThrow(/Topic not found/);
    expect(() => getLocalLesson('missing-lesson')).toThrow(/Lesson not found/);
    expect(() => listLocalExercisesByLesson('missing-lesson')).toThrow(/Lesson not found/);

    await recordLocalProgressAttempt({
      topicId: firstTopic.id,
      lessonId: firstLesson.id,
      score: 20,
      completedAt: '2026-08-12T00:00:00.000Z',
    });
    await recordLocalProgressAttempt({
      topicId: firstTopic.id,
      lessonId: firstLesson.id,
      score: 95,
      completedAt: '2026-08-12T00:01:00.000Z',
    });
    const progress = await getLocalLessonProgress(firstLesson.id);
    expect(progress).toMatchObject({ bestScore: 95, lastScore: 95, status: 'completed' });
  });

  it('lists progress snapshots after local attempts', async () => {
    const topic = listLocalTopics()[0]!;
    const lesson = listLocalLessonsByTopic(topic.id)[0]!;

    await recordLocalProgressAttempt({
      topicId: topic.id,
      lessonId: lesson.id,
      score: 45,
      completedAt: '2026-08-12T00:00:00.000Z',
    });

    const progressRows = await listLocalProgress();
    expect(progressRows).toHaveLength(1);
    expect(progressRows[0]).toMatchObject({
      lessonId: lesson.id,
      topicId: topic.id,
      status: 'in_progress',
      bestScore: 45,
    });
  });

  it('persists best-score completion and tolerates storage write failures', async () => {
    const topics = listLocalTopics();
    const lesson = listLocalLessonsByTopic(topics[0]!.id)[0]!;

    AsyncStorageMock.setItem.mockRejectedValueOnce(new Error('write-fail'));
    const first = await recordLocalProgressAttempt({
      topicId: topics[0]!.id,
      lessonId: lesson.id,
      score: 65,
      completedAt: '2026-08-12T00:00:00.000Z',
    });
    expect(first.status).toBe('in_progress');

    const second = await recordLocalProgressAttempt({
      topicId: topics[0]!.id,
      lessonId: lesson.id,
      score: 72,
      completedAt: '2026-08-12T00:01:00.000Z',
    });
    expect(second.status).toBe('completed');
    expect(second.completedAt).toBe('2026-08-12T00:01:00.000Z');

    const third = await recordLocalProgressAttempt({
      topicId: topics[0]!.id,
      lessonId: lesson.id,
      score: 30,
      completedAt: '2026-08-12T00:02:00.000Z',
    });
    expect(third.bestScore).toBe(72);
    expect(third.completedAt).toBe('2026-08-12T00:01:00.000Z');
  });
});
