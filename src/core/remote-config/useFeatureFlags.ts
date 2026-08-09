import { useQuery } from '@tanstack/react-query';

import { fetchFeatureFlags } from '@/core/remote-config/service';

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['remote-config', 'feature-flags'],
    queryFn: fetchFeatureFlags,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
