import { fetchPracticeStreak, mergePracticeStreak } from '@/features/home/services/streakService';

const mockRpc = jest.fn();

jest.mock('@/core/supabase/client', () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe('streakService', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('maps a streak row and ignores malformed dates', async () => {
    mockRpc.mockResolvedValue({
      data: {
        practice_dates: ['2026-08-16', 'nope', 1],
        celebrated_dates: ['2026-08-16'],
      },
      error: null,
    });
    await expect(fetchPracticeStreak()).resolves.toEqual({
      practiceDates: ['2026-08-16'],
      celebratedDates: ['2026-08-16'],
    });
    expect(mockRpc).toHaveBeenCalledWith('get_practice_streak');
  });

  it('returns null when fetch fails and throws when merge fails', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    await expect(fetchPracticeStreak()).resolves.toEqual({
      practiceDates: [],
      celebratedDates: [],
    });

    mockRpc.mockResolvedValue({ data: null, error: { message: 'offline' } });
    await expect(fetchPracticeStreak()).resolves.toBeNull();

    mockRpc.mockResolvedValue({ data: null, error: { message: 'denied' } });
    await expect(
      mergePracticeStreak({ practiceDates: ['2026-08-16'], celebratedDates: [] }),
    ).rejects.toMatchObject({ message: 'denied' });
  });

  it('merges dates through the RPC', async () => {
    mockRpc.mockResolvedValue({
      data: { practice_dates: ['2026-08-15', '2026-08-16'], celebrated_dates: ['2026-08-16'] },
      error: null,
    });
    await expect(
      mergePracticeStreak({ practiceDates: ['2026-08-16'], celebratedDates: ['2026-08-16'] }),
    ).resolves.toEqual({
      practiceDates: ['2026-08-15', '2026-08-16'],
      celebratedDates: ['2026-08-16'],
    });
    expect(mockRpc).toHaveBeenCalledWith('merge_practice_streak', {
      p_practice_dates: ['2026-08-16'],
      p_celebrated_dates: ['2026-08-16'],
    });
  });
});
