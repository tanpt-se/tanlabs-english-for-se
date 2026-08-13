import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CompletedVocabularySession } from '@/features/vocabulary/types/content';

const STORAGE_KEY = '@tanlabs/vocabulary_completed_sessions_v1';
const MAX_SESSIONS = 20;

type StoredSessions = Record<string, CompletedVocabularySession>;

async function readStore(): Promise<StoredSessions> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as StoredSessions;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: StoredSessions): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export async function saveCompletedSession(session: CompletedVocabularySession): Promise<void> {
  const store = await readStore();
  store[session.clientAttemptId] = session;

  const entries = Object.values(store).sort(
    (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt),
  );
  const trimmed = entries.slice(0, MAX_SESSIONS);
  const next: StoredSessions = {};
  for (const row of trimmed) {
    next[row.clientAttemptId] = row;
  }
  await writeStore(next);
}

export async function loadCompletedSession(
  clientAttemptId: string,
): Promise<CompletedVocabularySession | null> {
  const store = await readStore();
  return store[clientAttemptId] ?? null;
}

export async function resetCompletedSessionsForTests(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
}
