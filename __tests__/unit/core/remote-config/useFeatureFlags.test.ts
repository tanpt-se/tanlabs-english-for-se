import { useQuery } from '@tanstack/react-query';

import { fetchFeatureFlags } from '@/core/remote-config/service';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/core/remote-config/service', () => ({
  fetchFeatureFlags: jest.fn(),
}));

test('useFeatureFlags wires the remote-config query defaults', () => {
  jest.mocked(useQuery).mockReturnValue({ data: undefined } as never);

  useFeatureFlags();

  expect(useQuery).toHaveBeenCalledWith({
    queryKey: ['remote-config', 'feature-flags'],
    queryFn: fetchFeatureFlags,
    staleTime: 5 * 60_000,
    retry: 1,
  });
});
