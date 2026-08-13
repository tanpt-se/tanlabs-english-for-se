export const vocabularyKeys = {
  all: ['vocabulary'] as const,
  situations: () => [...vocabularyKeys.all, 'situations'] as const,
  situation: (situationId: string) => [...vocabularyKeys.all, 'situation', situationId] as const,
  exercises: (situationId: string) => [...vocabularyKeys.all, 'exercises', situationId] as const,
  weak: (userId: string) => [...vocabularyKeys.all, 'weak', userId] as const,
  attempt: (userId: string, clientAttemptId: string) =>
    [...vocabularyKeys.all, 'attempt', userId, clientAttemptId] as const,
  completedSession: (clientAttemptId: string) =>
    [...vocabularyKeys.all, 'completed-session', clientAttemptId] as const,
};
