import { NumberedLearningRow } from '@/components/ui/learning';
import type { PublishedLesson } from '@/features/grammar/services';

type GrammarLessonRowProps = {
  active: boolean;
  bestScorePercent: number | null;
  completed: boolean;
  index: number;
  lesson: PublishedLesson;
  onPress: () => void;
};

export function GrammarLessonRow({
  active,
  bestScorePercent,
  completed,
  index,
  lesson,
  onPress,
}: GrammarLessonRowProps) {
  const tone = completed ? 'completed' : active ? 'active' : 'upcoming';
  const status = completed
    ? `Completed · ${bestScorePercent ?? 100}%`
    : bestScorePercent !== null
    ? `Best ${bestScorePercent}%`
    : active
    ? 'Continue'
    : 'Start';

  return (
    <NumberedLearningRow
      accessibilityLabel={`${lesson.title}. ${lesson.description}. ${status}`}
      index={index + 1}
      subtitle={lesson.description}
      testID={`grammar-lesson-row-${lesson.slug}`}
      title={lesson.title}
      tone={tone}
      onPress={onPress}
    />
  );
}
