import { useQuery } from '@tanstack/react-query';

import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@/core/remote-config/service', () => ({
  fetchFeatureFlags: jest.fn(),
}));

jest.mock('@/app/config/env', () => ({
  VOCABULARY_FORCE_LOCAL_SEED: false,
}));

test('useFeatureFlags wires the remote-config query defaults', () => {
  jest.mocked(useQuery).mockReturnValue({ data: undefined } as never);

  useFeatureFlags();

  expect(useQuery).toHaveBeenCalledWith(
    expect.objectContaining({
      queryKey: ['remote-config', 'feature-flags'],
      staleTime: 5 * 60_000,
      retry: 1,
    }),
  );
  const call = jest.mocked(useQuery).mock.calls[0]?.[0] as { queryFn?: unknown };
  expect(typeof call.queryFn).toBe('function');
});
