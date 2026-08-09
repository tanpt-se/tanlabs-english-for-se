import { validateAuthCredentials } from '@/core/auth/validation';

describe('validateAuthCredentials', () => {
  it('rejects malformed email and short passwords', () => {
    expect(validateAuthCredentials('a@b', 'secret1')).toMatch(/valid email/i);
    expect(validateAuthCredentials('user@example.com', '123')).toMatch(/at least 6/);
  });

  it('accepts minimal valid credentials', () => {
    expect(validateAuthCredentials(' user@example.com ', 'secret1')).toBeNull();
  });
});
