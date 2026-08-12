import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/brand';
import { brand, themeTokens, useAppColors } from '@/theme';

type PracticeProgressBarProps = {
  index: number;
  total: number;
  canGoBack?: boolean;
  canSkip?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
};

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
      testID="grammar-practice-progress"
    >
      <View style={styles.trackRow}>
        <Pressable
          accessibilityLabel="Previous question"
          accessibilityRole="button"
          disabled={backDisabled}
          hitSlop={6}
          style={[
            styles.iconHit,
            {
              backgroundColor: colors.surface,
              borderColor: brand.borderDefault,
            },
            backDisabled && styles.iconDisabled,
          ]}
          testID="grammar-practice-back"
          onPress={() => {
            if (!backDisabled) {
              onBack?.();
            }
          }}
        >
          <AppIcon
            color={backDisabled ? colors.textMuted : colors.text}
            name="arrowLeft"
            size={16}
          />
        </Pressable>

        <View style={[styles.track, { backgroundColor: TRACK }]}>
          <View
            style={[
              styles.fill,
              {
                backgroundColor: brand.coral500,
                width: `${Math.max(ratio * 100, current > 0 ? 4 : 0)}%`,
              },
            ]}
          />
        </View>

        <Pressable
          accessibilityLabel="Skip question"
          accessibilityRole="button"
          disabled={skipDisabled}
          hitSlop={6}
          style={[
            styles.iconHit,
            {
              backgroundColor: colors.surface,
              borderColor: brand.borderDefault,
            },
            skipDisabled && styles.iconDisabled,
          ]}
          testID="grammar-practice-skip"
          onPress={() => {
            if (!skipDisabled) {
              onSkip?.();
            }
          }}
        >
          <AppIcon
            color={skipDisabled ? colors.textMuted : colors.text}
            name="arrowLeft"
            size={16}
            style={styles.flip}
          />
        </Pressable>
      </View>
    </View>
  );
}

const TRACK = '#E5E8ED';

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
    borderRadius: 14,
    borderWidth: 1,
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
    width: '100%',
  },
  wrap: {
    width: '100%',
  },
});
