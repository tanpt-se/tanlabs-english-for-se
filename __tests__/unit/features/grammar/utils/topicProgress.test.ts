import {
  countCompletedGrammarTopics,
  GRAMMAR_LESSONS_PER_TOPIC,
  isTopicFullyCompleted,
  lessonBestScoreRatio,
  topicBestScoreProgressRatio,
} from '@/features/grammar/utils/topicProgress';

describe('topicProgress', () => {
  it('requires every CEFR lesson before counting a topic complete', () => {
    expect(GRAMMAR_LESSONS_PER_TOPIC).toBe(4);
    expect(isTopicFullyCompleted(4, 1)).toBe(false);
    expect(isTopicFullyCompleted(4, 4)).toBe(true);
    expect(
      countCompletedGrammarTopics(
        ['t1', 't2'],
        [
          { topicId: 't1', status: 'completed' },
          { topicId: 't1', status: 'completed' },
          { topicId: 't1', status: 'completed' },
          { topicId: 't1', status: 'completed' },
          { topicId: 't2', status: 'completed' },
        ],
      ),
    ).toBe(1);
  });

  it('averages best scores so a partial lesson is not stuck at 0%', () => {
    expect(lessonBestScoreRatio({ lessonId: 'l1', status: 'in_progress', bestScore: 89 })).toBe(
      0.89,
    );
    expect(
      topicBestScoreProgressRatio(
        ['l1', 'l2', 'l3', 'l4'],
        [{ lessonId: 'l1', status: 'in_progress', bestScore: 89 }],
      ),
    ).toBeCloseTo(0.2225, 4);
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
});
