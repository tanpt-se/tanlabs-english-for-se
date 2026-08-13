export function validateAuthCredentials(email: string, password: string): string | null {
  const normalizedEmail = email.trim();
  if (normalizedEmail.length < 5 || !normalizedEmail.includes('@')) {
    return 'Enter a valid email address.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

export function validateEmailOnly(email: string): string | null {
  const normalizedEmail = email.trim();
  if (normalizedEmail.length < 5 || !normalizedEmail.includes('@')) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validateSignupOtp(token: string): string | null {
  const normalized = token.trim();
  if (!/^\d{6}$/.test(normalized)) {
    return 'Enter the 6-digit code from your email.';
  }
  return null;
}

export function validateNewPassword(password: string, confirmPassword: string): string | null {
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}
