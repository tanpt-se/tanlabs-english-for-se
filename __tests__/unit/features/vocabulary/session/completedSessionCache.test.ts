import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadCompletedSession,
  resetCompletedSessionsForTests,
  saveCompletedSession,
} from '@/features/vocabulary/session/completedSessionCache';

const session = {
  clientAttemptId: 'attempt-1',
  situationId: 'task-progress',
  situationSlug: 'task-progress',
  contentRevision: 1,
  correctCount: 8,
  totalCount: 10,
  score: 80,
  completed: true,
  answers: [{ exerciseId: 'e1', correct: true }],
  itemResults: [{ itemId: 'task-progress:blocker', correct: true }],
  startedAt: '2026-01-01T10:00:00.000Z',
  completedAt: '2026-01-01T10:20:00.000Z',
};

describe('vocabulary completedSessionCache', () => {
  beforeEach(async () => {
    await resetCompletedSessionsForTests();
  });

  it('persists and reloads a completed session', async () => {
    await saveCompletedSession(session);
    await expect(loadCompletedSession('attempt-1')).resolves.toEqual(session);
    await expect(loadCompletedSession('missing')).resolves.toBeNull();
  });

  it('trims to the most recent sessions and tolerates bad JSON', async () => {
    for (let index = 0; index < 25; index += 1) {
      await saveCompletedSession({
        ...session,
        clientAttemptId: `attempt-${index}`,
        completedAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
      });
    }
    const raw = await AsyncStorage.getItem('@tanlabs/vocabulary_completed_sessions_v1');
    const parsed = JSON.parse(raw ?? '{}') as Record<string, unknown>;
    expect(Object.keys(parsed)).toHaveLength(20);
    expect(parsed['attempt-24']).toBeTruthy();
    expect(parsed['attempt-0']).toBeUndefined();

    await AsyncStorage.setItem('@tanlabs/vocabulary_completed_sessions_v1', '{');
    await expect(loadCompletedSession('x')).resolves.toBeNull();
  });
});
