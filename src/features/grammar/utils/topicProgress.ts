import { GRAMMAR_COMPLETION_THRESHOLD } from '@/features/grammar/types/content';

export const GRAMMAR_LESSONS_PER_TOPIC = 3;

export function isTopicFullyCompleted(lessonCount: number, completedCount: number): boolean {
  return lessonCount > 0 && completedCount >= lessonCount;
}

export function countCompletedLessonsForTopic(
  topicId: string,
  progress: ReadonlyArray<{ topicId: string; status: string }>,
): number {
  return progress.filter((row) => row.topicId === topicId && row.status === 'completed').length;
}

export function pickFirstIncompleteTopic<T extends { id: string; lessonCount: number }>(
  topics: readonly T[],
  progress: ReadonlyArray<{ topicId: string; status: string }>,
): T | undefined {
  return topics.find(
    (topic) =>
      !isTopicFullyCompleted(topic.lessonCount, countCompletedLessonsForTopic(topic.id, progress)),
  );
}

export function countCompletedGrammarTopics(
  topicIds: string[],
  progress: ReadonlyArray<{ topicId: string; status: string }>,
  lessonsPerTopicById: ReadonlyMap<string, number> | number = GRAMMAR_LESSONS_PER_TOPIC,
): number {
  return topicIds.filter((topicId) => {
    const required =
      typeof lessonsPerTopicById === 'number'
        ? lessonsPerTopicById
        : lessonsPerTopicById.get(topicId) ?? GRAMMAR_LESSONS_PER_TOPIC;
    return isTopicFullyCompleted(required, countCompletedLessonsForTopic(topicId, progress));
  }).length;
}

type ProgressScoreRow = {
  lessonId: string;
  status: string;
  bestScore?: number | null;
};

export function lessonBestScoreRatio(row: ProgressScoreRow | undefined): number {
  if (!row || row.status === 'not_started') {
    return 0;
  }
  if (typeof row.bestScore === 'number') {
    return Math.max(0, Math.min(100, row.bestScore)) / 100;
  }
  if (row.status === 'completed') {
    return GRAMMAR_COMPLETION_THRESHOLD / 100;
  }
  return 0;
}

export function topicBestScoreProgressRatio(
  lessonIds: readonly string[],
  progress: ReadonlyArray<ProgressScoreRow>,
): number {
  if (lessonIds.length === 0) {
    return 0;
  }
  const byLesson = new Map(progress.map((row) => [row.lessonId, row]));
  const sum = lessonIds.reduce(
    (total, lessonId) => total + lessonBestScoreRatio(byLesson.get(lessonId)),
    0,
  );
  return sum / lessonIds.length;
}

export function progressStatusFromScore(score: number): 'in_progress' | 'completed' {
  return score >= GRAMMAR_COMPLETION_THRESHOLD ? 'completed' : 'in_progress';
}

export function categoryLearningStatus(
  topics: ReadonlyArray<{ id: string; lessonCount: number }>,
  progress: ReadonlyArray<{ topicId: string; status: string }>,
): {
  completed: number;
  ratio: number;
  status: 'not_started' | 'in_progress' | 'completed';
  total: number;
} {
  const total = topics.length;
  const lessonsPerTopicById = new Map(topics.map((topic) => [topic.id, topic.lessonCount]));
  const completed = countCompletedGrammarTopics(
    topics.map((topic) => topic.id),
    progress,
    lessonsPerTopicById,
  );
  const started = topics.some((topic) =>
    progress.some(
      (row) =>
        row.topicId === topic.id && (row.status === 'completed' || row.status === 'in_progress'),
    ),
  );
  const status: 'not_started' | 'in_progress' | 'completed' =
    total > 0 && completed >= total ? 'completed' : started ? 'in_progress' : 'not_started';
  return {
    completed,
    total,
    ratio: total === 0 ? 0 : completed / total,
    status,
  };
}
