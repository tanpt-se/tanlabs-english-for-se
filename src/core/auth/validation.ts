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
