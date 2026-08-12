import { GRAMMAR_COMPLETION_THRESHOLD, GRAMMAR_LEVELS } from '@/features/grammar/types/content';

export const GRAMMAR_LESSONS_PER_TOPIC = GRAMMAR_LEVELS.length;

export function isTopicFullyCompleted(lessonCount: number, completedCount: number): boolean {
  return lessonCount > 0 && completedCount >= lessonCount;
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
    const completedCount = progress.filter(
      (row) => row.topicId === topicId && row.status === 'completed',
    ).length;
    return isTopicFullyCompleted(required, completedCount);
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
