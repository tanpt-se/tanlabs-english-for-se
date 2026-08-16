import { StyleSheet, Text, View } from 'react-native';

import { brand, themeTokens, useAppColors } from '@/theme';

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
          { color: isToday ? colors.text : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.status,
          isComplete ? { backgroundColor: colors.primary, borderColor: colors.primary } : null,
          isToday ? { backgroundColor: colors.primarySoft, borderColor: colors.primary } : null,
          isUpcoming ? { backgroundColor: brand.cream50, borderColor: colors.border } : null,
        ]}
      >
        <Text
          style={[
            styles.statusGlyph,
            isToday ? styles.statusGlyphToday : null,
            {
              color: isComplete
                ? colors.onPrimary
                : isToday
                ? colors.primary
                : colors.textSecondary,
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
  /** @deprecated Prefer `title`. */
  badge?: string;
  days?: StreakDayState[];
  subtitle?: string;
  title?: string;
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function currentWeek(): StreakDayState[] {
  const today = (new Date().getDay() + 6) % 7;
  return DAY_LABELS.map((_, index) => (index === today ? 'today' : 'upcoming'));
}

function streakTitle(week: StreakDayState[]): string {
  const count = week.filter((day) => day === 'complete' || day === 'today').length;
  return count === 1 ? '1 day streak' : `${count} day streak`;
}

/** Weekly practice streak card (Figma Pattern/Home/StreakCard). */
export function StreakCard({
  badge,
  days,
  subtitle = 'Small steps, strong habit.',
  title,
}: StreakCardProps) {
  const colors = useAppColors();
  const week = days?.length === 7 ? days : currentWeek();
  const heading = title ?? badge ?? streakTitle(week);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{heading}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
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
  card: {
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    gap: themeTokens.spacing['12'],
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
    fontWeight: '500',
  },
  dayLabelToday: {
    fontWeight: '600',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  header: {
    gap: 3,
    width: '100%',
  },
  status: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  statusGlyph: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
  },
  statusGlyphToday: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: themeTokens.typography.size.caption,
    fontWeight: '400',
    lineHeight: themeTokens.typography.lineHeight.caption,
  },
  title: {
    fontSize: themeTokens.typography.size.body,
    fontWeight: '600',
    lineHeight: themeTokens.typography.lineHeight.body,
  },
});
