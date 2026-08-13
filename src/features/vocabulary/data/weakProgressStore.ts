import AsyncStorage from '@react-native-async-storage/async-storage';

import type { VocabularyItemOutcome } from '@/features/vocabulary/types/content';
import type { WeakProgressRow } from '@/features/vocabulary/utils/weakItems';

const STORAGE_KEY = '@tanlabs/vocabulary_weak_progress_v1';

type WeakProgressRecord = {
  itemId: string;
  lastResult: boolean | null;
  incorrectCount: number;
  correctCount: number;
  lastSeenAt: string | null;
};

let cache: Map<string, WeakProgressRecord> | null = null;
let hydratePromise: Promise<void> | null = null;

async function hydrate(): Promise<void> {
  if (cache) {
    return;
  }
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        if (Array.isArray(parsed)) {
          cache = new Map(
            parsed
              .filter(
                (item): item is WeakProgressRecord =>
                  typeof item === 'object' && item !== null && typeof item.itemId === 'string',
              )
              .map((item) => [item.itemId, item]),
          );
        } else {
          cache = new Map();
        }
      } catch {
        cache = new Map();
      }
    })();
  }
  await hydratePromise;
}

async function persist(): Promise<void> {
  if (!cache) {
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...cache.values()]));
}

export async function loadWeakProgress(
  situationId?: string,
): Promise<Map<string, WeakProgressRow>> {
  await hydrate();
  const result = new Map<string, WeakProgressRow>();
  if (!cache) {
    return result;
  }
  for (const [itemId, record] of cache) {
    if (!situationId || itemId.startsWith(`${situationId}:`)) {
      result.set(itemId, {
        ...record,
        sortOrder: 0,
      });
    }
  }
  return result;
}

export async function updateWeakProgress(itemResults: VocabularyItemOutcome[]): Promise<void> {
  await hydrate();
  if (!cache) {
    cache = new Map();
  }
  const now = new Date().toISOString();
  for (const result of itemResults) {
    const existing = cache.get(result.itemId);
    cache.set(result.itemId, {
      itemId: result.itemId,
      lastResult: result.correct,
      incorrectCount: (existing?.incorrectCount ?? 0) + (result.correct ? 0 : 1),
      correctCount: (existing?.correctCount ?? 0) + (result.correct ? 1 : 0),
      lastSeenAt: now,
    });
  }
  await persist();
}

/** Test helper */
export function resetWeakProgressForTests(): void {
  cache = null;
  hydratePromise = null;
}
