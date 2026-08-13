import { AUTH_RESET_URL, parseRecoveryLinkParams } from '@/core/auth/deepLink';
import { AuthUserError, mapAuthError } from '@/core/auth/errors';
import { supabase } from '@/core/supabase/client';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    throw mapAuthError(error);
  }
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) {
    throw mapAuthError(error);
  }
  return data;
}

export async function verifySignupOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'signup',
  });
  if (error) {
    throw mapAuthError(error, 'signup_otp');
  }
  return data;
}

export async function resendSignupOtp(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
  });
  if (error) {
    throw mapAuthError(error, 'signup_otp');
  }
  return data;
}

export async function requestPasswordReset(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: AUTH_RESET_URL,
  });
  if (error) {
    throw mapAuthError(error);
  }
  return data;
}

export async function verifyRecoveryFromUrl(url: string) {
  const params = parseRecoveryLinkParams(url);

  if (params.tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: 'recovery',
    });
    if (error) {
      throw mapAuthError(error, 'recovery');
    }
    return data;
  }

  if (params.accessToken && params.refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
    if (error) {
      throw mapAuthError(error, 'recovery');
    }
    return data;
  }

  throw new AuthUserError('unknown', 'Invalid or expired reset link.');
}

export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw mapAuthError(error);
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw mapAuthError(error);
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session;
}
