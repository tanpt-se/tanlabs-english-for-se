jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

type LocalSeedModule = typeof import('@/features/grammar/services/localSeedCatalog');

function loadCatalogModule(): {
  mod: LocalSeedModule;
  storage: { getItem: jest.Mock; setItem: jest.Mock };
} {
  jest.resetModules();
  let mod!: LocalSeedModule;
  let storage!: { getItem: jest.Mock; setItem: jest.Mock };
  jest.isolateModules(() => {
    storage = require('@react-native-async-storage/async-storage') as {
      getItem: jest.Mock;
      setItem: jest.Mock;
    };
    mod = require('@/features/grammar/services/localSeedCatalog') as LocalSeedModule;
  });
  return { mod, storage };
}

describe('grammarLocalSeedCatalog hydration paths', () => {
  beforeEach(() => {
    const storage = jest.requireMock('@react-native-async-storage/async-storage') as {
      getItem: jest.Mock;
      setItem: jest.Mock;
    };
    storage.getItem.mockReset();
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockReset();
    storage.setItem.mockResolvedValue(undefined);
  });

  it('hydrates progress from stored arrays and skips invalid rows', async () => {
    const { mod, storage } = loadCatalogModule();
    const lesson = mod.listAllLocalLessons()[0]!;

    storage.getItem.mockResolvedValueOnce(
      JSON.stringify([
        {
          lessonId: lesson.id,
          topicId: lesson.topicId,
          status: 'in_progress',
          bestScore: 41,
          lastScore: 41,
          lastActivityAt: '2026-08-12T00:00:00.000Z',
          completedAt: null,
        },
        {
          topicId: lesson.topicId,
          status: 'in_progress',
        },
      ]),
    );

    const progress = await mod.listLocalProgress();
    expect(progress).toHaveLength(1);
    expect(progress[0]?.lessonId).toBe(lesson.id);
  });

  it('keeps progress empty for malformed JSON or non-array payloads', async () => {
    const { mod: modMalformed, storage: storageMalformed } = loadCatalogModule();
    storageMalformed.getItem.mockResolvedValueOnce('{"bad":"shape"}');
    await expect(modMalformed.listLocalProgress()).resolves.toEqual([]);

    const { mod: modInvalidJson, storage: storageInvalidJson } = loadCatalogModule();
    storageInvalidJson.getItem.mockResolvedValueOnce('{broken');
    await expect(modInvalidJson.listLocalProgress()).resolves.toEqual([]);

    const { mod: modReadFailure, storage: storageReadFailure } = loadCatalogModule();
    storageReadFailure.getItem.mockRejectedValueOnce(new Error('storage down'));
    await expect(modReadFailure.listLocalProgress()).resolves.toEqual([]);
  });

  it('continues recording progress even when persistence write fails', async () => {
    const { mod, storage } = loadCatalogModule();
    const topic = mod.listLocalTopics()[0]!;
    const lesson = mod.listLocalLessonsByTopic(topic.id)[0]!;
    storage.setItem.mockRejectedValueOnce(new Error('write fail'));

    const row = await mod.recordLocalProgressAttempt({
      topicId: topic.id,
      lessonId: lesson.id,
      score: 55,
      completedAt: '2026-08-12T00:00:00.000Z',
    });

    expect(row.status).toBe('in_progress');
    expect(row.bestScore).toBe(55);
    expect(await mod.getLocalLessonProgress(lesson.id)).toMatchObject({ bestScore: 55 });
  });
});
