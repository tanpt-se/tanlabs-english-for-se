export type AuthErrorKind =
  | 'rate_limit'
  | 'invalid_credentials'
  | 'email_taken'
  | 'otp_invalid'
  | 'recovery_invalid'
  | 'network'
  | 'unknown';

export class AuthUserError extends Error {
  readonly kind: AuthErrorKind;

  constructor(kind: AuthErrorKind, message: string) {
    super(message);
    this.name = 'AuthUserError';
    this.kind = kind;
  }
}

type AuthErrorInput = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
};

const RATE_LIMIT_MESSAGE =
  'Too many attempts right now. Wait about a minute, then try again — or sign in if you already registered.';

const OTP_INVALID_MESSAGE = 'That code is invalid or expired. Request a new one.';

const RECOVERY_LINK_MESSAGE =
  'Reset link expired or invalid. Request a new one from Forgot password.';

export type AuthErrorFlow = 'default' | 'signup_otp' | 'recovery';

function isOtpRelatedError(normalized: string, code: string): boolean {
  if (code.includes('otp')) {
    return true;
  }
  return (
    normalized.includes('otp') ||
    normalized.includes('one time token') ||
    normalized.includes('verification code')
  );
}

/** Token / OTP expiry for recovery links — avoid bare "expired" (too broad). */
function isRecoveryTokenError(normalized: string, code: string): boolean {
  if (code.includes('otp') || code.includes('token_expired')) {
    return true;
  }
  return (
    isOtpRelatedError(normalized, code) ||
    normalized.includes('token has expired') ||
    normalized.includes('token is invalid') ||
    normalized.includes('expired or is invalid') ||
    normalized.includes('invalid or expired reset')
  );
}

export function mapAuthError(
  input: AuthErrorInput | string,
  flow: AuthErrorFlow = 'default',
): AuthUserError {
  const message = typeof input === 'string' ? input : input.message ?? '';
  const code = typeof input === 'string' ? '' : input.code ?? '';
  const status = typeof input === 'string' ? undefined : input.status ?? undefined;
  const normalized = `${code} ${message}`.toLowerCase();
  const codeLower = code.toLowerCase();

  if (
    status === 429 ||
    normalized.includes('rate limit') ||
    normalized.includes('over_email') ||
    normalized.includes('email_rate_limit') ||
    normalized.includes('too many requests')
  ) {
    return new AuthUserError('rate_limit', RATE_LIMIT_MESSAGE);
  }

  if (normalized.includes('invalid login') || normalized.includes('invalid credentials')) {
    return new AuthUserError('invalid_credentials', 'Invalid email or password.');
  }

  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return new AuthUserError('email_taken', 'An account with this email already exists.');
  }

  if (flow === 'recovery' && isRecoveryTokenError(normalized, codeLower)) {
    return new AuthUserError('recovery_invalid', RECOVERY_LINK_MESSAGE);
  }

  if (
    flow === 'signup_otp' &&
    (isOtpRelatedError(normalized, codeLower) ||
      codeLower.includes('token_expired') ||
      normalized.includes('token has expired') ||
      normalized.includes('expired or is invalid'))
  ) {
    return new AuthUserError('otp_invalid', OTP_INVALID_MESSAGE);
  }

  if (isOtpRelatedError(normalized, codeLower)) {
    return new AuthUserError('otp_invalid', OTP_INVALID_MESSAGE);
  }

  if (normalized.includes('network') || normalized.includes('fetch failed')) {
    return new AuthUserError('network', 'Network unavailable. Try again.');
  }

  return new AuthUserError('unknown', 'Something went wrong. Please try again.');
}

export function isAuthRateLimitError(error: unknown): boolean {
  return error instanceof AuthUserError && error.kind === 'rate_limit';
}
