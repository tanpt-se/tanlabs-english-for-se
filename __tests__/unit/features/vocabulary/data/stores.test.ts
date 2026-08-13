import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  isItemKnown,
  loadKnownItemIds,
  markItemsKnown,
  resetKnownItemsCacheForTests,
  setItemKnown,
  toggleItemKnown,
} from '@/features/vocabulary/data/knownItemsStore';
import {
  loadWeakProgress,
  resetWeakProgressForTests,
  updateWeakProgress,
} from '@/features/vocabulary/data/weakProgressStore';

describe('knownItemsStore', () => {
  beforeEach(async () => {
    resetKnownItemsCacheForTests();
    await AsyncStorage.clear();
  });

  it('hydrates, toggles, and marks known ids', async () => {
    await AsyncStorage.setItem(
      '@tanlabs/vocabulary_known_item_ids_v1',
      JSON.stringify(['a', 1, 'b']),
    );
    await expect(loadKnownItemIds()).resolves.toEqual(new Set(['a', 'b']));
    await expect(isItemKnown('a')).resolves.toBe(true);

    await setItemKnown('c', true);
    await expect(isItemKnown('c')).resolves.toBe(true);

    await setItemKnown('c', false);
    await expect(isItemKnown('c')).resolves.toBe(false);

    const next = await toggleItemKnown('a');
    expect(next).toBe(false);

    await markItemsKnown(['x', 'y']);
    await expect(isItemKnown('x')).resolves.toBe(true);
  });

  it('recovers from corrupt storage', async () => {
    await AsyncStorage.setItem('@tanlabs/vocabulary_known_item_ids_v1', '{');
    await expect(loadKnownItemIds()).resolves.toEqual(new Set());
  });

  it('treats non-array JSON as empty and reuses in-flight hydrate', async () => {
    await AsyncStorage.setItem(
      '@tanlabs/vocabulary_known_item_ids_v1',
      JSON.stringify({ not: 'array' }),
    );
    const [a, b] = await Promise.all([loadKnownItemIds(), loadKnownItemIds()]);
    expect(a).toEqual(new Set());
    expect(b).toEqual(new Set());

    await AsyncStorage.setItem('@tanlabs/vocabulary_known_item_ids_v1', JSON.stringify(null));
    resetKnownItemsCacheForTests();
    await expect(loadKnownItemIds()).resolves.toEqual(new Set());
  });
});

describe('weakProgressStore', () => {
  beforeEach(async () => {
    resetWeakProgressForTests();
    await AsyncStorage.clear();
  });

  it('loads, filters by situation, and updates counters', async () => {
    await AsyncStorage.setItem(
      '@tanlabs/vocabulary_weak_progress_v1',
      JSON.stringify([
        {
          itemId: 'task-progress:blocker',
          lastResult: false,
          incorrectCount: 2,
          correctCount: 1,
          lastSeenAt: '2026-01-01T00:00:00.000Z',
        },
        {
          itemId: 'meetings:agenda',
          lastResult: true,
          incorrectCount: 0,
          correctCount: 3,
          lastSeenAt: '2026-01-02T00:00:00.000Z',
        },
        { notAnItem: true },
      ]),
    );

    const all = await loadWeakProgress();
    expect(all.size).toBe(2);
    const filtered = await loadWeakProgress('task-progress');
    expect([...filtered.keys()]).toEqual(['task-progress:blocker']);

    await updateWeakProgress([
      { itemId: 'task-progress:blocker', correct: true },
      { itemId: 'task-progress:ship', correct: false },
    ]);
    const after = await loadWeakProgress('task-progress');
    expect(after.get('task-progress:blocker')?.correctCount).toBe(2);
    expect(after.get('task-progress:ship')?.incorrectCount).toBe(1);
  });

  it('handles non-array storage', async () => {
    await AsyncStorage.setItem(
      '@tanlabs/vocabulary_weak_progress_v1',
      JSON.stringify({ nope: true }),
    );
    await expect(loadWeakProgress()).resolves.toEqual(new Map());
  });
});
