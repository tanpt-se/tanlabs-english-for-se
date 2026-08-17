import { ConfirmModal } from '@/components/ui/feedback/ConfirmModal';

type StreakReachedModalProps = {
  onContinue: () => void;
  visible: boolean;
};

export function StreakReachedModal({ onContinue, visible }: StreakReachedModalProps) {
  return (
    <ConfirmModal
      confirmLabel="Continue"
      message="You've hit today's streak. Keep going."
      showCancel={false}
      title="Today's streak"
      visible={visible}
      onCancel={onContinue}
      onConfirm={onContinue}
    />
  );
}
