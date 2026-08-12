export const grammarKeys = {
  all: ['grammar'] as const,
  topics: () => [...grammarKeys.all, 'topics'] as const,
  topic: (topicId: string) => [...grammarKeys.all, 'topic', topicId] as const,
  lessons: (topicId: string) => [...grammarKeys.all, 'lessons', topicId] as const,
  lesson: (lessonId: string) => [...grammarKeys.all, 'lesson', lessonId] as const,
  exercises: (lessonId: string) => [...grammarKeys.all, 'exercises', lessonId] as const,
  allLessons: () => [...grammarKeys.all, 'all-lessons'] as const,
  progress: (userId: string) => [...grammarKeys.all, 'progress', userId] as const,
  attempt: (userId: string, clientAttemptId: string) =>
    [...grammarKeys.all, 'attempt', userId, clientAttemptId] as const,
  completedSession: (clientAttemptId: string) =>
    [...grammarKeys.all, 'completed-session', clientAttemptId] as const,
  lessonProgress: (userId: string, lessonId: string) =>
    [...grammarKeys.all, 'progress', userId, lessonId] as const,
};
