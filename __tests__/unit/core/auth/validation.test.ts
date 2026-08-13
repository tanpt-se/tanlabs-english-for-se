import {
  validateAuthCredentials,
  validateEmailOnly,
  validateNewPassword,
  validateSignupOtp,
} from '@/core/auth/validation';

describe('validateAuthCredentials', () => {
  it('rejects malformed email and short passwords', () => {
    expect(validateAuthCredentials('a@b', 'secret1')).toMatch(/valid email/i);
    expect(validateAuthCredentials('user@example.com', '123')).toMatch(/at least 6/);
  });

  it('accepts minimal valid credentials', () => {
    expect(validateAuthCredentials(' user@example.com ', 'secret1')).toBeNull();
  });
});

describe('validateEmailOnly', () => {
  it('requires a valid email', () => {
    expect(validateEmailOnly('bad')).toMatch(/valid email/i);
    expect(validateEmailOnly('user@example.com')).toBeNull();
  });
});

describe('validateSignupOtp', () => {
  it('requires a 6-digit code', () => {
    expect(validateSignupOtp('12345')).toMatch(/6-digit/i);
    expect(validateSignupOtp('123456')).toBeNull();
  });
});

describe('validateNewPassword', () => {
  it('requires matching passwords of minimum length', () => {
    expect(validateNewPassword('123', '123')).toMatch(/at least 6/i);
    expect(validateNewPassword('secret1', 'secret2')).toMatch(/do not match/i);
    expect(validateNewPassword('secret1', 'secret1')).toBeNull();
  });
});
