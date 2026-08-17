import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';

import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import type { StreakDayState } from '@/features/home/components/StreakCard';
import { loadStreakSnapshot, recordPracticeDay } from '@/features/home/data/streakStore';
import { weekDayStates } from '@/features/home/utils/streak';

const LOCAL_STREAK_USER = 'local';

export function usePracticeStreak() {
  const { user } = useAuth();
  const userId = user?.id ?? LOCAL_STREAK_USER;
  const [week, setWeek] = useState<StreakDayState[]>(() => weekDayStates([], new Date()));
  const [title, setTitle] = useState('0 day streak');

  const refresh = useCallback(async () => {
    const snapshot = await loadStreakSnapshot(userId);
    setWeek(snapshot.week);
    setTitle(snapshot.heading);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined);
    }, [refresh]),
  );

  return { refresh, title, week };
}

type StreakCelebrationInput = {
  completedAt?: string | null;
  userId?: string | null;
};

export function useStreakCelebration({ completedAt, userId }: StreakCelebrationInput) {
  const [visible, setVisible] = useState(false);
  const ownerId = userId ?? LOCAL_STREAK_USER;

  useEffect(() => {
    if (!completedAt) {
      return;
    }
    const practicedAt = new Date(completedAt);
    if (Number.isNaN(practicedAt.getTime())) {
      return;
    }
    let alive = true;
    recordPracticeDay(ownerId, practicedAt)
      .then((snapshot) => {
        if (alive && snapshot.shouldCelebrate) {
          trackEvent('streak_day_unlocked', { count: snapshot.consecutive }).catch(() => undefined);
          setVisible(true);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [completedAt, ownerId]);

  return {
    dismiss: () => setVisible(false),
    visible,
  };
}
