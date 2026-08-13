export type VocabularyDomainErrorCode =
  | 'not_found'
  | 'invalid_content'
  | 'unauthorized'
  | 'unavailable';

export class VocabularyDomainError extends Error {
  readonly code: VocabularyDomainErrorCode;

  constructor(code: VocabularyDomainErrorCode, message: string) {
    super(message);
    this.name = 'VocabularyDomainError';
    this.code = code;
  }
}

export function toVocabularyDomainError(error: unknown): VocabularyDomainError {
  if (error instanceof VocabularyDomainError) {
    return error;
  }
  return new VocabularyDomainError('unavailable', 'Unable to load Vocabulary content right now.');
}
