import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  isItemKnown,
  loadKnownItemIds,
  resetKnownItemsCacheForTests,
  setItemKnown,
} from '@/features/vocabulary/data/knownItemsStore';
import {
  loadWeakProgress,
  resetWeakProgressForTests,
  updateWeakProgress,
} from '@/features/vocabulary/data/weakProgressStore';
import { sortWeakItems } from '@/features/vocabulary/utils/weakItems';

describe('store + weakItems remaining branches', () => {
  beforeEach(async () => {
    resetKnownItemsCacheForTests();
    resetWeakProgressForTests();
    await AsyncStorage.clear();
  });

  it('reuses hydrated known cache and persists deletions', async () => {
    await setItemKnown('a', true);
    await expect(isItemKnown('a')).resolves.toBe(true);
    // second hydrate hits cache branch
    await expect(loadKnownItemIds()).resolves.toEqual(new Set(['a']));
    await setItemKnown('a', false);
    await expect(isItemKnown('a')).resolves.toBe(false);
  });

  it('updates weak progress from empty cache and sorts by seen/order/id', async () => {
    await updateWeakProgress([{ itemId: 's:a', correct: false }]);
    const map = await loadWeakProgress();
    expect(map.get('s:a')?.incorrectCount).toBe(1);

    expect(
      sortWeakItems([
        {
          itemId: 'b',
          lastResult: false,
          incorrectCount: 1,
          correctCount: 0,
          lastSeenAt: '2026-01-02',
          sortOrder: 2,
        },
        {
          itemId: 'a',
          lastResult: false,
          incorrectCount: 1,
          correctCount: 0,
          lastSeenAt: '2026-01-01',
          sortOrder: 1,
        },
        {
          itemId: 'c',
          lastResult: false,
          incorrectCount: 1,
          correctCount: 0,
          lastSeenAt: '2026-01-01',
          sortOrder: 1,
        },
      ]).map((row) => row.itemId),
    ).toEqual(['a', 'c', 'b']);
  });
});
