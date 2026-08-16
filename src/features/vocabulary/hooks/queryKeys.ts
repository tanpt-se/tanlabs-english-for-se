export const vocabularyKeys = {
  all: ['vocabulary'] as const,
  situations: () => [...vocabularyKeys.all, 'situations'] as const,
  situation: (situationId: string) => [...vocabularyKeys.all, 'situation', situationId] as const,
  situationItems: (situationId: string) =>
    [...vocabularyKeys.all, 'situation-items', situationId] as const,
  library: (queryKey: string) => [...vocabularyKeys.all, 'library', queryKey] as const,
  term: (situationId: string, itemId: string) =>
    [...vocabularyKeys.all, 'term', situationId, itemId] as const,
  exercises: (situationId: string) => [...vocabularyKeys.all, 'exercises', situationId] as const,
  weakExercises: (itemIdsKey: string) =>
    [...vocabularyKeys.all, 'weak-exercises', itemIdsKey] as const,
  weak: (userId: string) => [...vocabularyKeys.all, 'weak', userId] as const,
  attempt: (userId: string, clientAttemptId: string) =>
    [...vocabularyKeys.all, 'attempt', userId, clientAttemptId] as const,
  completedSession: (clientAttemptId: string) =>
    [...vocabularyKeys.all, 'completed-session', clientAttemptId] as const,
};
