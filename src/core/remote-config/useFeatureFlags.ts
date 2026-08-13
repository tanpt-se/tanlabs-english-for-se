import { useQuery } from '@tanstack/react-query';

import { VOCABULARY_FORCE_LOCAL_SEED } from '@/app/config/env';
import { fetchFeatureFlags } from '@/core/remote-config/service';

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['remote-config', 'feature-flags'],
    queryFn: async () => {
      const flags = await fetchFeatureFlags();
      if (!VOCABULARY_FORCE_LOCAL_SEED) {
        return flags;
      }
      return { ...flags, vocabulary: true };
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
