export type GrammarDomainErrorCode =
  | 'not_found'
  | 'invalid_content'
  | 'unauthorized'
  | 'unavailable';

export class GrammarDomainError extends Error {
  readonly code: GrammarDomainErrorCode;

  constructor(code: GrammarDomainErrorCode, message: string) {
    super(message);
    this.name = 'GrammarDomainError';
    this.code = code;
  }
}

export function toGrammarDomainError(error: unknown): GrammarDomainError {
  if (error instanceof GrammarDomainError) {
    return error;
  }
  return new GrammarDomainError('unavailable', 'Unable to load Grammar content right now.');
}
