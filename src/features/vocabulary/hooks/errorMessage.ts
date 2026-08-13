import { VocabularyDomainError } from '@/features/vocabulary/services/errors';

export function vocabularyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof VocabularyDomainError) {
    return error.message;
  }
  return fallback;
}
