import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/brand';
import { themeTokens, useAppColors } from '@/theme';

type PracticeProgressBarProps = {
  index: number;
  total: number;
  canGoBack?: boolean;
  canSkip?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
};

function StepHit({
  accessibilityLabel,
  disabled,
  flip,
  onPress,
  testID,
}: {
  accessibilityLabel: string;
  disabled: boolean;
  flip?: boolean;
  onPress?: () => void;
  testID: string;
}) {
  const colors = useAppColors();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={6}
      style={[styles.iconHit, disabled && styles.iconDisabled]}
      testID={testID}
      onPress={onPress}
    >
      <AppIcon
        color={disabled ? colors.textMuted : colors.text}
        name="arrowLeft"
        size={16}
        style={flip ? styles.flip : undefined}
      />
    </Pressable>
  );
}

export function PracticeProgressBar({
  index,
  total,
  canGoBack = false,
  canSkip = false,
  onBack,
  onSkip,
}: PracticeProgressBarProps) {
  const colors = useAppColors();
  const safeTotal = Math.max(total, 1);
  const current = Math.min(Math.max(index + 1, 0), safeTotal);
  const ratio = current / safeTotal;
  const backDisabled = !canGoBack || !onBack;
  const skipDisabled = !canSkip || !onSkip;

  return (
    <View
      accessibilityLabel={`Question ${current} of ${safeTotal}`}
      style={styles.wrap}
      testID="vocabulary-practice-progress"
    >
      <View style={styles.trackRow}>
        <StepHit
          accessibilityLabel="Previous question"
          disabled={backDisabled}
          testID="vocabulary-practice-back"
          onPress={onBack}
        />
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: colors.primary,
                width: `${Math.max(ratio * 100, current > 0 ? 4 : 0)}%`,
              },
            ]}
          />
        </View>
        <StepHit
          accessibilityLabel="Skip question"
          disabled={skipDisabled}
          flip
          testID="vocabulary-practice-skip"
          onPress={onSkip}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    borderRadius: 3,
    height: 6,
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  iconHit: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  iconDisabled: {
    opacity: 0.45,
  },
  track: {
    borderRadius: 3,
    flex: 1,
    height: 6,
    minWidth: 0,
    overflow: 'hidden',
  },
  trackRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: themeTokens.spacing.sm,
    height: 28,
    width: '100%',
  },
  wrap: {
    width: '100%',
  },
});
