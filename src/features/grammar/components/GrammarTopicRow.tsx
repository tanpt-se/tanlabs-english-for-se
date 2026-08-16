import {
  GrammarTopicCard,
  type GrammarTopicStatus,
} from '@/features/grammar/components/GrammarTopicCard';
import { useGrammarLessons, useGrammarProgress } from '@/features/grammar/hooks';
import type { PublishedTopic } from '@/features/grammar/services';
import { isTopicFullyCompleted, topicBestScoreProgressRatio } from '@/features/grammar/utils';

type GrammarTopicRowProps = {
  onPress: () => void;
  topic: PublishedTopic;
};

function topicStatus(
  lessonCount: number,
  completedCount: number,
  startedCount: number,
): GrammarTopicStatus {
  if (lessonCount === 0 || (completedCount <= 0 && startedCount <= 0)) {
    return 'not_started';
  }
  if (isTopicFullyCompleted(lessonCount, completedCount)) {
    return 'completed';
  }
  return 'in_progress';
}

export function GrammarTopicRow({ topic, onPress }: GrammarTopicRowProps) {
  const lessonsQuery = useGrammarLessons(topic.id);
  const progressQuery = useGrammarProgress();
  const lessons = lessonsQuery.data ?? [];
  const progressRows = (progressQuery.data ?? []).filter((row) => row.topicId === topic.id);
  const completedCount = progressRows.filter((row) => row.status === 'completed').length;
  const startedCount = progressRows.filter(
    (row) => row.status === 'completed' || row.status === 'in_progress',
  ).length;
  const lessonCount = lessons.length;
  const status = topicStatus(lessonCount, completedCount, startedCount);
  const progress =
    status === 'not_started' || lessonCount === 0
      ? 0
      : topicBestScoreProgressRatio(
          lessons.map((lesson) => lesson.id),
          progressRows,
        );
  const progressPercent = Math.round(progress * 100);

  const subtitle =
    status === 'completed'
      ? topic.description
      : status === 'in_progress'
      ? `${progressPercent}% · ${completedCount} of ${lessonCount} lesson${
          lessonCount === 1 ? '' : 's'
        } passed`
      : lessonCount === 0
      ? 'Coming soon'
      : '0% · 3 lessons · Ready to begin';

  return (
    <GrammarTopicCard
      topic={topic}
      status={status}
      subtitle={subtitle}
      progress={progress}
      onPress={onPress}
    />
  );
}
