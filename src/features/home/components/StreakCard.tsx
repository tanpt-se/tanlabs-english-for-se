import { StyleSheet, Text, View } from 'react-native';

import { themeTokens, useAppColors } from '@/theme';

export type StreakDayState = 'complete' | 'today' | 'upcoming';

type StreakDayProps = {
  label: string;
  state: StreakDayState;
};

/** One day in a seven-day streak: Complete ✓, Today •, Upcoming empty. */
export function StreakDay({ label, state }: StreakDayProps) {
  const colors = useAppColors();
  const isComplete = state === 'complete';
  const isToday = state === 'today';
  const isUpcoming = state === 'upcoming';

  return (
    <View style={styles.cell}>
      <Text
        style={[
          styles.dayLabel,
          isToday ? styles.dayLabelToday : null,
          { color: isToday ? colors.text : colors.textMuted },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.status,
          isComplete ? { backgroundColor: colors.primary, borderColor: colors.primary } : null,
          isToday ? { backgroundColor: colors.primarySoft, borderColor: colors.primary } : null,
          isUpcoming ? { backgroundColor: colors.primarySoft, borderColor: colors.border } : null,
        ]}
      >
        <Text
          style={[
            styles.statusGlyph,
            {
              color: isComplete ? colors.onPrimary : isToday ? colors.primary : colors.textMuted,
            },
          ]}
        >
          {isComplete ? '✓' : isToday ? '•' : ' '}
        </Text>
      </View>
    </View>
  );
}

type StreakCardProps = {
  badge?: string;
  days?: StreakDayState[];
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function currentWeek(): StreakDayState[] {
  const today = (new Date().getDay() + 6) % 7;
  return DAY_LABELS.map((_, index) => (index === today ? 'today' : 'upcoming'));
}

/** Weekly practice streak card (peach surface + seven-day strip). */
export function StreakCard({ badge = 'This week', days }: StreakCardProps) {
  const colors = useAppColors();
  const week = days?.length === 7 ? days : currentWeek();

  return (
    <View style={[styles.card, { backgroundColor: colors.primarySoft }]}>
      <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
      </View>
      <View style={styles.days}>
        {DAY_LABELS.map((day, index) => (
          <StreakDay key={day} label={day} state={week[index] ?? 'upcoming'} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: themeTokens.radius.card,
    paddingHorizontal: themeTokens.spacing['10'],
    paddingVertical: themeTokens.spacing['6'],
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    borderRadius: 18,
    gap: themeTokens.spacing['12'],
    overflow: 'hidden',
    padding: themeTokens.spacing.md,
    width: '100%',
  },
  cell: {
    alignItems: 'center',
    flex: 1,
    gap: themeTokens.spacing.sm,
    height: 56,
    justifyContent: 'center',
    minWidth: 28,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '400',
  },
  dayLabelToday: {
    fontWeight: '600',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  status: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  statusGlyph: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
});
