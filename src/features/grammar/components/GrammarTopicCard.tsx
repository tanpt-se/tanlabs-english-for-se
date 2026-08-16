import { PathStatusCard } from '@/components/ui/learning';
import type { PublishedTopic } from '@/features/grammar/services';

export type GrammarTopicStatus = 'not_started' | 'in_progress' | 'completed';

type GrammarTopicCardProps = {
  onPress: () => void;
  progress: number;
  status: GrammarTopicStatus;
  subtitle: string;
  topic: PublishedTopic;
};

export function GrammarTopicCard({
  topic,
  status,
  subtitle,
  progress,
  onPress,
}: GrammarTopicCardProps) {
  return (
    <PathStatusCard
      title={topic.title}
      status={status}
      subtitle={subtitle}
      progress={progress}
      onPress={onPress}
      testID={`grammar-topic-${topic.slug}`}
    />
  );
}
