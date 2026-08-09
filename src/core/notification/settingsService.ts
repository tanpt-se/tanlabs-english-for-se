import { supabase } from '@/core/supabase/client';
import type { Database } from '@/types/database';

type NotificationSettings = Database['public']['Tables']['notification_settings']['Row'];

export async function fetchNotificationSettings(
  userId: string,
): Promise<NotificationSettings | null> {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function setNotificationEnabled(
  userId: string,
  enabled: boolean,
): Promise<NotificationSettings> {
  const { data, error } = await supabase
    .from('notification_settings')
    .upsert({ user_id: userId, enabled })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
