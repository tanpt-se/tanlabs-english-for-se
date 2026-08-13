import { AuthUserError } from '@/core/auth/errors';
import {
  requestPasswordReset,
  resendSignupOtp,
  updatePassword,
  verifyRecoveryFromUrl,
  verifySignupOtp,
} from '@/core/auth/service';
import { supabase } from '@/core/supabase/client';

jest.mock('@/core/supabase/client', () => ({
  supabase: {
    auth: {
      verifyOtp: jest.fn(),
      resend: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      setSession: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

describe('auth service extensions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies signup OTP', async () => {
    jest
      .mocked(supabase.auth.verifyOtp)
      .mockResolvedValueOnce({ data: { session: null, user: null }, error: null });
    await verifySignupOtp('user@example.com', '123456');
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: '123456',
      type: 'signup',
    });
  });

  it('resends signup OTP', async () => {
    jest
      .mocked(supabase.auth.resend)
      .mockResolvedValueOnce({ data: { user: null, session: null }, error: null });
    await resendSignupOtp('user@example.com');
    expect(supabase.auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'user@example.com',
    });
  });

  it('requests password reset with redirect URL', async () => {
    jest
      .mocked(supabase.auth.resetPasswordForEmail)
      .mockResolvedValueOnce({ data: {}, error: null });
    await requestPasswordReset('user@example.com');
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
      redirectTo: 'tanlabs://auth/reset',
    });
  });

  it('verifies recovery token hash from deep link', async () => {
    jest.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { session: {} as never, user: {} as never },
      error: null,
    });
    await verifyRecoveryFromUrl('tanlabs://auth/reset?token_hash=hash123&type=recovery');
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'hash123',
      type: 'recovery',
    });
  });

  it('sets session from recovery hash tokens', async () => {
    jest.mocked(supabase.auth.setSession).mockResolvedValueOnce({
      data: { session: {} as never, user: {} as never },
      error: null,
    });
    await verifyRecoveryFromUrl('tanlabs://auth/reset#access_token=at&refresh_token=rt');
    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'at',
      refresh_token: 'rt',
    });
  });

  it('updates password for signed-in user', async () => {
    jest
      .mocked(supabase.auth.updateUser)
      .mockResolvedValueOnce({ data: { user: {} as never }, error: null });
    await updatePassword('secret12');
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'secret12' });
  });

  it('maps signup OTP errors', async () => {
    jest.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: 'Token has expired or is invalid', status: 403 } as never,
    });
    await expect(verifySignupOtp('user@example.com', '000000')).rejects.toBeInstanceOf(
      AuthUserError,
    );
  });

  it('maps resend OTP errors', async () => {
    jest.mocked(supabase.auth.resend).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Too many requests', status: 429 } as never,
    });
    await expect(resendSignupOtp('user@example.com')).rejects.toMatchObject({ kind: 'rate_limit' });
  });

  it('maps password reset errors', async () => {
    jest.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValueOnce({
      data: {},
      error: { message: 'Network down' } as never,
    });
    await expect(requestPasswordReset('user@example.com')).rejects.toBeInstanceOf(AuthUserError);
  });

  it('rejects recovery links without tokens', async () => {
    await expect(verifyRecoveryFromUrl('tanlabs://auth/reset')).rejects.toMatchObject({
      message: 'Invalid or expired reset link.',
    });
  });

  it('maps recovery verifyOtp errors', async () => {
    jest.mocked(supabase.auth.verifyOtp).mockResolvedValueOnce({
      data: { session: null, user: null },
      error: {
        message: 'Token has expired or is invalid',
        code: 'otp_expired',
        status: 403,
      } as never,
    });
    await expect(
      verifyRecoveryFromUrl('tanlabs://auth/reset?token_hash=bad&type=recovery'),
    ).rejects.toMatchObject({ kind: 'recovery_invalid' });
  });

  it('maps setSession recovery errors', async () => {
    jest.mocked(supabase.auth.setSession).mockResolvedValueOnce({
      data: { session: null, user: null },
      error: {
        message: 'Token has expired or is invalid',
        code: 'otp_expired',
        status: 401,
      } as never,
    });
    await expect(
      verifyRecoveryFromUrl('tanlabs://auth/reset#access_token=at&refresh_token=rt'),
    ).rejects.toMatchObject({ kind: 'recovery_invalid' });
  });

  it('maps update password errors', async () => {
    jest.mocked(supabase.auth.updateUser).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Weak password' } as never,
    });
    await expect(updatePassword('short')).rejects.toBeInstanceOf(AuthUserError);
  });
});
