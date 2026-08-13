import {
  pickContinueLessonForTopic,
  pickGlobalContinueLearning,
} from '@/features/grammar/utils/continueLearning';

describe('continueLearning', () => {
  const lessons = [
    { id: 'l1', sortOrder: 1 },
    { id: 'l2', sortOrder: 2 },
    { id: 'l3', sortOrder: 3 },
  ];

  it('picks the most recently active incomplete lesson within a topic', () => {
    expect(
      pickContinueLessonForTopic(lessons, [
        { lessonId: 'l1', status: 'completed', lastActivityAt: '2026-01-03T10:00:00.000Z' },
        { lessonId: 'l2', status: 'in_progress', lastActivityAt: '2026-01-05T10:00:00.000Z' },
        { lessonId: 'l3', status: 'in_progress', lastActivityAt: '2026-01-04T10:00:00.000Z' },
      ]),
    ).toEqual({ id: 'l2', sortOrder: 2 });
  });

  it('falls back to the first not-started lesson when nothing has activity', () => {
    expect(
      pickContinueLessonForTopic(lessons, [
        { lessonId: 'l1', status: 'completed', lastActivityAt: '2026-01-03T10:00:00.000Z' },
      ]),
    ).toEqual({ id: 'l2', sortOrder: 2 });
  });

  it('returns null for empty/all-completed topic lessons', () => {
    expect(pickContinueLessonForTopic([], [])).toBeNull();
    expect(
      pickContinueLessonForTopic(lessons, [
        { lessonId: 'l1', status: 'completed', lastActivityAt: '2026-01-03T10:00:00.000Z' },
        { lessonId: 'l2', status: 'completed', lastActivityAt: '2026-01-03T10:00:00.000Z' },
        { lessonId: 'l3', status: 'completed', lastActivityAt: '2026-01-03T10:00:00.000Z' },
      ]),
    ).toBeNull();
  });

  it('breaks in-topic activity ties by lesson sort order', () => {
    expect(
      pickContinueLessonForTopic(lessons, [
        { lessonId: 'l2', status: 'in_progress', lastActivityAt: '2026-01-10T00:00:00.000Z' },
        { lessonId: 'l3', status: 'in_progress', lastActivityAt: '2026-01-10T00:00:00.000Z' },
      ]),
    ).toEqual({ id: 'l2', sortOrder: 2 });
  });

  it('picks the global most recent incomplete lesson with stable tie-breakers', () => {
    const topics = [
      { id: 't1', sortOrder: 1 },
      { id: 't2', sortOrder: 2 },
    ];
    const lessonsByTopic = new Map([
      [
        't1',
        [
          { id: 'l1a', sortOrder: 1 },
          { id: 'l1b', sortOrder: 2 },
        ],
      ],
      [
        't2',
        [
          { id: 'l2a', sortOrder: 1 },
          { id: 'l2b', sortOrder: 2 },
        ],
      ],
    ]);

    expect(
      pickGlobalContinueLearning(topics, lessonsByTopic, [
        {
          topicId: 't1',
          lessonId: 'l1a',
          status: 'in_progress',
          lastActivityAt: '2026-01-02T10:00:00.000Z',
        },
        {
          topicId: 't2',
          lessonId: 'l2a',
          status: 'in_progress',
          lastActivityAt: '2026-01-06T10:00:00.000Z',
        },
      ]),
    ).toEqual({ topicId: 't2', lessonId: 'l2a' });
  });

  it('starts at the first topic lesson when the learner has no progress', () => {
    const topics = [{ id: 't1', sortOrder: 1 }];
    const lessonsByTopic = new Map([['t1', [{ id: 'l1', sortOrder: 1 }]]]);
    expect(pickGlobalContinueLearning(topics, lessonsByTopic, [])).toEqual({
      topicId: 't1',
      lessonId: 'l1',
    });
    expect(pickGlobalContinueLearning([], new Map(), [])).toBeNull();
  });

  it('handles invalid activity timestamps and tie-break ordering', () => {
    const topics = [
      { id: 't1', sortOrder: 1 },
      { id: 't2', sortOrder: 2 },
    ];
    const lessonsByTopic = new Map([
      [
        't1',
        [
          { id: 'l1a', sortOrder: 1 },
          { id: 'l1b', sortOrder: 2 },
        ],
      ],
      ['t2', [{ id: 'l2a', sortOrder: 1 }]],
    ]);

    expect(
      pickGlobalContinueLearning(topics, lessonsByTopic, [
        { topicId: 't1', lessonId: 'l1a', status: 'in_progress', lastActivityAt: 'invalid-date' },
        { topicId: 't1', lessonId: 'l1b', status: 'in_progress', lastActivityAt: null },
      ]),
    ).toEqual({ topicId: 't1', lessonId: 'l1a' });

    expect(
      pickGlobalContinueLearning(topics, lessonsByTopic, [
        {
          topicId: 't1',
          lessonId: 'l1a',
          status: 'in_progress',
          lastActivityAt: '2026-01-01T00:00:00Z',
        },
        {
          topicId: 't2',
          lessonId: 'l2a',
          status: 'in_progress',
          lastActivityAt: '2026-01-01T00:00:00Z',
        },
      ]),
    ).toEqual({ topicId: 't1', lessonId: 'l1a' });

    expect(
      pickContinueLessonForTopic(
        [
          { id: 'l1', sortOrder: 1 },
          { id: 'l2', sortOrder: 2 },
        ],
        [
          { lessonId: 'l1', status: 'in_progress', lastActivityAt: 'not-a-date' },
          { lessonId: 'l2', status: 'in_progress', lastActivityAt: 'also-bad' },
        ],
      ),
    ).toEqual({ id: 'l1', sortOrder: 1 });

    expect(
      pickContinueLessonForTopic(
        [{ id: 'l1', sortOrder: 1 }],
        [{ lessonId: 'l1', status: 'completed', lastActivityAt: null }],
      ),
    ).toBeNull();
  });
});
