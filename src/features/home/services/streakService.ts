import { isSupabaseConfigured, supabase } from '@/core/supabase/client';
import { normalizeDateKeys, type StreakRecord } from '@/features/home/utils/streak';

function parseRow(data: unknown): StreakRecord {
  if (!data || typeof data !== 'object') {
    return { celebratedDates: [], practiceDates: [] };
  }
  const row = data as { celebrated_dates?: unknown; practice_dates?: unknown };
  return {
    celebratedDates: normalizeDateKeys(
      Array.isArray(row.celebrated_dates) ? row.celebrated_dates : [],
    ),
    practiceDates: normalizeDateKeys(Array.isArray(row.practice_dates) ? row.practice_dates : []),
  };
}

export async function fetchPracticeStreak(): Promise<StreakRecord | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const { data, error } = await supabase.rpc('get_practice_streak');
  if (error) {
    return null;
  }
  return parseRow(data);
}

export async function mergePracticeStreak(record: StreakRecord): Promise<StreakRecord> {
  if (!isSupabaseConfigured) {
    return record;
  }
  const { data, error } = await supabase.rpc('merge_practice_streak', {
    p_celebrated_dates: record.celebratedDates,
    p_practice_dates: record.practiceDates,
  });
  if (error) {
    throw error;
  }
  return parseRow(data);
}
