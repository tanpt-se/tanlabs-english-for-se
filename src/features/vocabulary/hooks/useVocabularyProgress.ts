import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';

import { loadKnownItemIds } from '@/features/vocabulary/data/knownItemsStore';
import {
  formatProgress,
  VOCABULARY_SITUATIONS,
  type VocabularySituation,
} from '@/features/vocabulary/data/mockCatalog';
import { countKnownInSituation } from '@/features/vocabulary/utils/progress';

export type VocabularySituationProgress = VocabularySituation & {
  progressLabel: string;
  /** Known / total in 0..1 for progress bars. */
  progressRatio: number;
};

export function useVocabularyProgress() {
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const ids = await loadKnownItemIds();
    setKnownIds(ids);
    setReady(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined);
    }, [refresh]),
  );

  const situations = useMemo<VocabularySituationProgress[]>(
    () =>
      VOCABULARY_SITUATIONS.map((situation) => {
        const learned = countKnownInSituation(situation.id, knownIds);
        const total = Math.max(0, situation.total);
        return {
          ...situation,
          learned,
          progressLabel: formatProgress(learned, situation.total),
          progressRatio: total === 0 ? 0 : Math.min(1, learned / total),
        };
      }),
    [knownIds],
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

  return {
    knownIds,
    ready,
    refresh,
    situations,
    totalKnown,
    totalTerms,
    overallRatio,
    overallLabel: formatProgress(totalKnown, totalTerms),
  };
}
