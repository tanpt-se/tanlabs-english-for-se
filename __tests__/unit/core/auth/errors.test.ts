import { AuthUserError, isAuthRateLimitError, mapAuthError } from '@/core/auth/errors';

describe('mapAuthError', () => {
  it('maps rate-limit message and status', () => {
    const fromMessage = mapAuthError({ message: 'Email rate limit exceeded' });
    expect(fromMessage.kind).toBe('rate_limit');
    expect(fromMessage.message).toMatch(/wait about a minute/i);

    const fromStatus = mapAuthError({ message: 'busy', status: 429 });
    expect(fromStatus.kind).toBe('rate_limit');

    const fromCode = mapAuthError({ code: 'over_email_send_rate_limit', message: 'x' });
    expect(fromCode.kind).toBe('rate_limit');
  });

  it('maps common auth cases', () => {
    expect(mapAuthError({ message: 'Invalid login credentials' }).kind).toBe('invalid_credentials');
    expect(mapAuthError({ message: 'Invalid credentials' }).kind).toBe('invalid_credentials');
    expect(mapAuthError({ message: 'User already registered' }).kind).toBe('email_taken');
    expect(mapAuthError({ message: 'User has already been registered' }).kind).toBe('email_taken');
    expect(mapAuthError({ message: 'Network request failed' }).kind).toBe('network');
    expect(mapAuthError({ message: 'Token has expired or is invalid' }).kind).toBe('unknown');
    expect(mapAuthError({ message: 'Invalid OTP' }).kind).toBe('otp_invalid');
    expect(mapAuthError('fetch failed')).toBeInstanceOf(AuthUserError);
    expect(mapAuthError({ message: 'weird' }).kind).toBe('unknown');
    expect(mapAuthError({ message: 'too many requests' }).kind).toBe('rate_limit');
    expect(mapAuthError({ code: 'email_rate_limit_exceeded', message: '' }).kind).toBe(
      'rate_limit',
    );
  });

  it('detects AuthUserError rate limit', () => {
    expect(isAuthRateLimitError(mapAuthError({ status: 429, message: '' }))).toBe(true);
    expect(isAuthRateLimitError(new Error('rate limit'))).toBe(false);
    expect(isAuthRateLimitError(new AuthUserError('unknown', 'x'))).toBe(false);
  });

  it('maps recovery token errors with recovery_invalid kind', () => {
    const fromCode = mapAuthError({ code: 'token_expired', message: 'x' }, 'recovery');
    expect(fromCode.kind).toBe('recovery_invalid');
    expect(fromCode.message).toMatch(/reset link expired/i);

    expect(mapAuthError({ message: 'Token has expired or is invalid' }, 'recovery').kind).toBe(
      'recovery_invalid',
    );

    // Bare "expired" without token/OTP context must not become recovery_invalid
    expect(mapAuthError({ message: 'Session expired elsewhere' }, 'recovery').kind).toBe('unknown');

    expect(mapAuthError({ code: 'token_expired', message: 'x' }).kind).toBe('unknown');
  });

  it('maps signup_otp token expiry to otp_invalid', () => {
    expect(mapAuthError({ message: 'Invalid OTP' }, 'signup_otp').kind).toBe('otp_invalid');
    expect(mapAuthError({ code: 'token_expired', message: 'x' }, 'signup_otp').kind).toBe(
      'otp_invalid',
    );
    expect(mapAuthError({ message: 'Token has expired or is invalid' }, 'signup_otp').kind).toBe(
      'otp_invalid',
    );
  });
});
