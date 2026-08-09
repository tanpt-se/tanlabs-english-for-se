import { isEnglishLevel, validateProfileInput } from '@/core/profile/validation';
import { supabase } from '@/core/supabase/client';
import type { EnglishLevel, Profile } from '@/types/database';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertProfile(input: {
  userId: string;
  displayName: string;
  englishLevel: string;
}): Promise<Profile> {
  const validationError = validateProfileInput({
    displayName: input.displayName,
    englishLevel: input.englishLevel,
  });
  if (validationError) {
    throw new Error(validationError);
  }
  if (!isEnglishLevel(input.englishLevel)) {
    throw new Error('Select a valid English level.');
  }

  const payload = {
    id: input.userId,
    display_name: input.displayName.trim(),
    english_level: input.englishLevel as EnglishLevel,
  };

  const { data, error } = await supabase.from('profiles').upsert(payload).select('*').single();

  if (error) {
    throw error;
  }

  return data;
}
