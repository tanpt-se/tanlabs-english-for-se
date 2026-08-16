import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

import { loadKnownItemIds } from '@/features/vocabulary/data/knownItemsStore';
import { useVocabularySituations } from '@/features/vocabulary/hooks/useVocabularyQueries';
import { pickFirstUnlearnedCore } from '@/features/vocabulary/utils/continueCore';
import { countKnownInSituation, formatProgress } from '@/features/vocabulary/utils/progress';

export type VocabularySituationProgress = {
  id: string;
  slug: string;
  title: string;
  description: string;
  learned: number;
  total: number;
  progressLabel: string;
  /** Known / total in 0..1 for progress bars. */
  progressRatio: number;
};

export function useVocabularyProgress() {
  const situationsQuery = useVocabularySituations();
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [knownReady, setKnownReady] = useState(false);

  const refreshKnown = useCallback(async () => {
    const ids = await loadKnownItemIds();
    setKnownIds(ids);
    setKnownReady(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshKnown().catch(() => undefined);
    }, [refreshKnown]),
  );

  const situations = useMemo<VocabularySituationProgress[]>(
    () =>
      (situationsQuery.data ?? []).map((situation) => {
        const coreIds = situation.coreItemIds?.length ? situation.coreItemIds : situation.itemIds;
        const learned = countKnownInSituation(situation.slug, knownIds, coreIds);
        const total = Math.max(0, coreIds.length);
        return {
          id: situation.id,
          slug: situation.slug,
          title: situation.title,
          description: situation.description,
          learned,
          total,
          progressLabel: formatProgress(learned, total),
          progressRatio: total === 0 ? 0 : Math.min(1, learned / total),
        };
      }),
    [knownIds, situationsQuery.data],
  );

  const totalKnown = useMemo(
    () => situations.reduce((sum, situation) => sum + situation.learned, 0),
    [situations],
  );
  const totalTerms = useMemo(
    () => situations.reduce((sum, situation) => sum + situation.total, 0),
    [situations],
  );
  const overallRatio = totalTerms === 0 ? 0 : Math.min(1, totalKnown / totalTerms);
  const ready = knownReady && !situationsQuery.isLoading;

  const continueTarget = useMemo(() => {
    const rows = (situationsQuery.data ?? []).flatMap((situation, index) =>
      (situation.coreItemIds ?? []).map((id, order) => ({
        id,
        situationId: situation.slug,
        title: situation.title,
        coreOrder: order + 1,
        situationSortOrder: index + 1,
      })),
    );
    return pickFirstUnlearnedCore(rows, knownIds);
  }, [knownIds, situationsQuery.data]);

  const libraryTotal = useMemo(
    () =>
      (situationsQuery.data ?? []).reduce(
        (sum, situation) => sum + (situation.itemIds?.length ?? situation.total ?? 0),
        0,
      ),
    [situationsQuery.data],
  );
  const libraryKnown = useMemo(
    () =>
      (situationsQuery.data ?? []).reduce(
        (sum, situation) =>
          sum + countKnownInSituation(situation.slug, knownIds, situation.itemIds),
        0,
      ),
    [knownIds, situationsQuery.data],
  );
  const libraryRatio = libraryTotal === 0 ? 0 : Math.min(1, libraryKnown / libraryTotal);

  return {
    knownIds,
    ready,
    refresh: async () => {
      await refreshKnown();
      await situationsQuery.refetch();
    },
    isError: situationsQuery.isError,
    situations,
    totalKnown,
    totalTerms,
    overallRatio,
    overallLabel: formatProgress(totalKnown, totalTerms),
    continueTarget,
    libraryTotal,
    libraryKnown,
    libraryRatio,
  };
}
