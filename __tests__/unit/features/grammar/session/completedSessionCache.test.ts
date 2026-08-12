import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadCompletedSession,
  resetCompletedSessionsForTests,
  saveCompletedSession,
} from '@/features/grammar/session/completedSessionCache';

const session = {
  clientAttemptId: 'attempt-1',
  topicId: 'topic-1',
  lessonId: 'lesson-1',
  contentRevision: 1,
  correctCount: 16,
  totalCount: 18,
  score: 89,
  completed: true,
  answers: [{ exerciseId: 'e1', correct: true }],
  startedAt: '2026-01-01T10:00:00.000Z',
  completedAt: '2026-01-01T10:20:00.000Z',
};

describe('completedSessionCache', () => {
  beforeEach(async () => {
    await resetCompletedSessionsForTests();
  });

  it('persists and reloads a completed session by clientAttemptId', async () => {
    await saveCompletedSession(session);
    await expect(loadCompletedSession('attempt-1')).resolves.toEqual(session);
    await expect(loadCompletedSession('missing')).resolves.toBeNull();
  });

  it('trims to the most recent sessions', async () => {
    for (let index = 0; index < 25; index += 1) {
      await saveCompletedSession({
        ...session,
        clientAttemptId: `attempt-${index}`,
        completedAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
      });
    }
    const raw = await AsyncStorage.getItem('@tanlabs/grammar_completed_sessions_v1');
    const parsed = JSON.parse(raw ?? '{}') as Record<string, unknown>;
    expect(Object.keys(parsed)).toHaveLength(20);
    expect(parsed['attempt-24']).toBeTruthy();
    expect(parsed['attempt-0']).toBeUndefined();
  });
});
