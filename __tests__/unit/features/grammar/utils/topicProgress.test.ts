import {
  categoryLearningStatus,
  countCompletedGrammarTopics,
  countCompletedLessonsForTopic,
  GRAMMAR_LESSONS_PER_TOPIC,
  isTopicFullyCompleted,
  lessonBestScoreRatio,
  pickFirstIncompleteTopic,
  topicBestScoreProgressRatio,
} from '@/features/grammar/utils/topicProgress';

describe('topicProgress', () => {
  it('requires every lesson before counting a topic complete', () => {
    expect(GRAMMAR_LESSONS_PER_TOPIC).toBe(3);
    expect(isTopicFullyCompleted(3, 1)).toBe(false);
    expect(isTopicFullyCompleted(3, 3)).toBe(true);
    expect(
      countCompletedGrammarTopics(
        ['t1', 't2'],
        [
          { topicId: 't1', status: 'completed' },
          { topicId: 't1', status: 'completed' },
          { topicId: 't1', status: 'completed' },
          { topicId: 't2', status: 'completed' },
        ],
      ),
    ).toBe(1);
  });

  it('ignores unpublished v1 progress rows when counting v2 topics', () => {
    expect(
      countCompletedGrammarTopics(
        ['v2-present-simple'],
        [
          { topicId: 'v1-present-simple', status: 'completed' },
          { topicId: 'v1-present-simple', status: 'completed' },
          { topicId: 'v1-present-simple', status: 'completed' },
          { topicId: 'v1-present-simple', status: 'completed' },
        ],
      ),
    ).toBe(0);
  });

  it('averages best scores so a partial lesson is not stuck at 0%', () => {
    expect(lessonBestScoreRatio({ lessonId: 'l1', status: 'in_progress', bestScore: 89 })).toBe(
      0.89,
    );
    expect(
      topicBestScoreProgressRatio(
        ['l1', 'l2', 'l3'],
        [{ lessonId: 'l1', status: 'in_progress', bestScore: 89 }],
      ),
    ).toBeCloseTo(0.2966, 3);
  });

  it('counts completed topics using per-topic lesson counts', () => {
    expect(
      countCompletedGrammarTopics(
        ['t1', 't2'],
        [
          { topicId: 't1', status: 'completed' },
          { topicId: 't1', status: 'completed' },
          { topicId: 't1', status: 'completed' },
          { topicId: 't2', status: 'completed' },
          { topicId: 't2', status: 'completed' },
        ],
        new Map([
          ['t1', 3],
          ['t2', 4],
        ]),
      ),
    ).toBe(1);
  });

  it('handles status and score edge cases', () => {
    expect(lessonBestScoreRatio(undefined)).toBe(0);
    expect(lessonBestScoreRatio({ lessonId: 'l1', status: 'not_started' })).toBe(0);
    expect(lessonBestScoreRatio({ lessonId: 'l1', status: 'in_progress', bestScore: 999 })).toBe(1);
    expect(lessonBestScoreRatio({ lessonId: 'l1', status: 'in_progress', bestScore: -10 })).toBe(0);
    expect(lessonBestScoreRatio({ lessonId: 'l1', status: 'completed' })).toBe(0.7);
    expect(topicBestScoreProgressRatio([], [])).toBe(0);
  });

  it('derives category learning status from topic completion', () => {
    const topics = [
      { id: 't1', lessonCount: 3 },
      { id: 't2', lessonCount: 3 },
    ];
    expect(categoryLearningStatus(topics, [])).toEqual({
      completed: 0,
      total: 2,
      ratio: 0,
      status: 'not_started',
    });
    expect(categoryLearningStatus(topics, [{ topicId: 't1', status: 'in_progress' }]).status).toBe(
      'in_progress',
    );
    expect(
      categoryLearningStatus(topics, [
        { topicId: 't1', status: 'completed' },
        { topicId: 't1', status: 'completed' },
        { topicId: 't1', status: 'completed' },
        { topicId: 't2', status: 'completed' },
        { topicId: 't2', status: 'completed' },
        { topicId: 't2', status: 'completed' },
      ]),
    ).toEqual({
      completed: 2,
      total: 2,
      ratio: 1,
      status: 'completed',
    });
    expect(categoryLearningStatus([], []).status).toBe('not_started');
  });

  it('picks the first incomplete topic and counts completed lessons per topic', () => {
    const topics = [
      { id: 't1', lessonCount: 3, title: 'Present Simple' },
      { id: 't2', lessonCount: 3, title: 'Present Continuous' },
    ];
    const progress = [
      { topicId: 't1', status: 'completed' },
      { topicId: 't1', status: 'completed' },
      { topicId: 't1', status: 'completed' },
      { topicId: 't2', status: 'completed' },
    ];
    expect(countCompletedLessonsForTopic('t1', progress)).toBe(3);
    expect(pickFirstIncompleteTopic(topics, progress)?.id).toBe('t2');
    expect(
      pickFirstIncompleteTopic(topics, [
        ...progress,
        { topicId: 't2', status: 'completed' },
        { topicId: 't2', status: 'completed' },
      ]),
    ).toBeUndefined();
  });
});
