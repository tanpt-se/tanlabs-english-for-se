import { supabase } from '@/core/supabase/client';

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login')) {
    return 'Invalid email or password.';
  }
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'An account with this email already exists.';
  }
  if (normalized.includes('rate limit') || normalized.includes('over_email')) {
    return 'Too many auth emails sent. Wait a minute, or turn Email Confirmation OFF in Supabase.';
  }
  if (normalized.includes('network')) {
    return 'Network unavailable. Try again.';
  }
  return 'Something went wrong. Please try again.';
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    throw new Error(mapAuthError(error.message));
  }
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) {
    throw new Error(mapAuthError(error.message));
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(mapAuthError(error.message));
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}
