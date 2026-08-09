import { validateProfileInput } from '@/core/profile/validation';

describe('validateProfileInput', () => {
  it('rejects short names', () => {
    expect(validateProfileInput({ displayName: 'A', englishLevel: 'B1' })).toMatch(/at least 2/);
  });

  it('rejects invalid levels', () => {
    expect(validateProfileInput({ displayName: 'Alex', englishLevel: 'C2' })).toMatch(
      /valid English/,
    );
  });

  it('accepts valid input', () => {
    expect(validateProfileInput({ displayName: 'Alex', englishLevel: 'B1' })).toBeNull();
  });
});
