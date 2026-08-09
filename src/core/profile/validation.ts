export const ENGLISH_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export type EnglishLevelOption = (typeof ENGLISH_LEVELS)[number];

export type ProfileInput = {
  displayName: string;
  englishLevel: string;
};

export function validateProfileInput(input: ProfileInput): string | null {
  const displayName = input.displayName.trim();
  if (displayName.length < 2) {
    return 'Display name must be at least 2 characters.';
  }
  if (displayName.length > 40) {
    return 'Display name must be at most 40 characters.';
  }
  if (!ENGLISH_LEVELS.includes(input.englishLevel as EnglishLevelOption)) {
    return 'Select a valid English level.';
  }
  return null;
}

export function isEnglishLevel(value: string): value is EnglishLevelOption {
  return ENGLISH_LEVELS.includes(value as EnglishLevelOption);
}
