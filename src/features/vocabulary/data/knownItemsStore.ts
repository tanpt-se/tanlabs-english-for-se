import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tanlabs/vocabulary_known_item_ids_v1';

let cache: Set<string> | null = null;
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
        cache = new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
      } catch {
        cache = new Set();
      }
    })();
  }
  await hydratePromise;
}

async function persist(): Promise<void> {
  if (!cache) {
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...cache]));
}

export async function loadKnownItemIds(): Promise<Set<string>> {
  await hydrate();
  return new Set(cache ?? []);
}

export async function isItemKnown(itemId: string): Promise<boolean> {
  await hydrate();
  return Boolean(cache?.has(itemId));
}

export async function setItemKnown(itemId: string, known: boolean): Promise<void> {
  await hydrate();
  if (!cache) {
    cache = new Set();
  }
  if (known) {
    cache.add(itemId);
  } else {
    cache.delete(itemId);
  }
  await persist();
}

export async function toggleItemKnown(itemId: string): Promise<boolean> {
  const next = !(await isItemKnown(itemId));
  await setItemKnown(itemId, next);
  return next;
}

export async function markItemsKnown(itemIds: string[]): Promise<void> {
  await hydrate();
  if (!cache) {
    cache = new Set();
  }
  for (const id of itemIds) {
    cache.add(id);
  }
  await persist();
}

/** Test helper */
export function resetKnownItemsCacheForTests(): void {
  cache = null;
  hydratePromise = null;
}
