import { PathStatusCard, type PathStatus } from '@/components/ui/learning';

type SituationCardProps = {
  description: string;
  onPress?: () => void;
  progress: string;
  progressRatio?: number;
  /** @deprecated Visual selection is IN PROGRESS status from progressRatio. */
  selected?: boolean;
  testID?: string;
  title: string;
};

function clampRatio(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function statusFromRatio(ratio: number): PathStatus {
  if (ratio <= 0) {
    return 'not_started';
  }
  if (ratio >= 1) {
    return 'completed';
  }
  return 'in_progress';
}

/** Situation list card — Figma Vocabulary Home situation row. */
export function SituationCard({
  description,
  onPress,
  progress,
  progressRatio = 0,
  testID,
  title,
}: SituationCardProps) {
  const ratio = clampRatio(progressRatio);
  const status = statusFromRatio(ratio);
  const subtitle =
    status === 'not_started'
      ? `${progress} · Ready to begin`
      : status === 'completed'
      ? `${progress} · Completed`
      : `${progress} · Continue learning`;

  return (
    <PathStatusCard
      accessibilityLabel={`${title}, ${progress}`}
      title={title}
      status={status}
      subtitle={`${subtitle}. ${description}`}
      progress={ratio}
      testID={testID}
      onPress={onPress}
    />
  );
}
