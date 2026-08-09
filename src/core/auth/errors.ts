export type AuthErrorKind =
  | 'rate_limit'
  | 'invalid_credentials'
  | 'email_taken'
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

export function mapAuthError(input: AuthErrorInput | string): AuthUserError {
  const message = typeof input === 'string' ? input : input.message ?? '';
  const code = typeof input === 'string' ? '' : input.code ?? '';
  const status = typeof input === 'string' ? undefined : input.status ?? undefined;
  const normalized = `${code} ${message}`.toLowerCase();

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

  if (normalized.includes('network') || normalized.includes('fetch failed')) {
    return new AuthUserError('network', 'Network unavailable. Try again.');
  }

  return new AuthUserError('unknown', 'Something went wrong. Please try again.');
}

export function isAuthRateLimitError(error: unknown): boolean {
  return error instanceof AuthUserError && error.kind === 'rate_limit';
}
