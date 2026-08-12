import { GrammarDomainError } from '@/features/grammar/services/errors';

export function grammarErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof GrammarDomainError) {
    return error.message;
  }
  return fallback;
}
