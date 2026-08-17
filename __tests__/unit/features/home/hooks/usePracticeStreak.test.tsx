import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { usePracticeStreak, useStreakCelebration } from '@/features/home/hooks/usePracticeStreak';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require('react') as typeof import('react');
    useEffect(callback, [callback]);
  },
}));

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

jest.mock('@/features/home/data/streakStore', () => ({
  recordPracticeDay: jest.fn(),
  loadStreakSnapshot: jest.fn(),
}));

const store = jest.requireMock('@/features/home/data/streakStore') as {
  recordPracticeDay: jest.Mock;
  loadStreakSnapshot: jest.Mock;
};
const { useAuth } = jest.requireMock('@/core/auth/AuthProvider') as { useAuth: jest.Mock };
const { trackEvent } = jest.requireMock('@/core/analytics/events') as { trackEvent: jest.Mock };

describe('usePracticeStreak', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  it('loads the week snapshot on focus', async () => {
    store.loadStreakSnapshot.mockResolvedValue({
      shouldCelebrate: false,
      consecutive: 2,
      heading: '2 day streak',
      practiceDates: ['2026-08-15', '2026-08-16'],
      week: ['complete', 'complete', 'today', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
    });

    let api: ReturnType<typeof usePracticeStreak> | undefined;
    function Probe() {
      api = usePracticeStreak();
      return null;
    }

    await act(async () => {
      ReactTestRenderer.create(<Probe />);
      await Promise.resolve();
    });
    expect(store.loadStreakSnapshot).toHaveBeenCalledWith('user-1');
    expect(api?.title).toBe('2 day streak');
    expect(api?.week[0]).toBe('complete');
  });

  it('falls back to a local owner when signed out', async () => {
    useAuth.mockReturnValue({ user: null });
    store.loadStreakSnapshot.mockResolvedValue({
      shouldCelebrate: false,
      consecutive: 0,
      heading: '0 day streak',
      practiceDates: [],
      week: ['today', 'upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
    });

    function Probe() {
      usePracticeStreak();
      return null;
    }

    await act(async () => {
      ReactTestRenderer.create(<Probe />);
      await Promise.resolve();
    });
    expect(store.loadStreakSnapshot).toHaveBeenCalledWith('local');
  });
});

describe('useStreakCelebration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the modal only when a new day is unlocked', async () => {
    store.recordPracticeDay.mockResolvedValue({
      shouldCelebrate: true,
      consecutive: 1,
      heading: '1 day streak',
      practiceDates: ['2026-08-16'],
      week: [],
    });

    let api: ReturnType<typeof useStreakCelebration> | undefined;
    function Probe({ completedAt }: { completedAt?: string }) {
      api = useStreakCelebration({ completedAt, userId: 'user-1' });
      return null;
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<Probe />);
    });
    expect(api?.visible).toBe(false);
    expect(store.recordPracticeDay).not.toHaveBeenCalled();

    await act(async () => {
      root.update(<Probe completedAt="2026-08-16T09:00:00.000Z" />);
      await Promise.resolve();
    });
    expect(store.recordPracticeDay).toHaveBeenCalledWith(
      'user-1',
      new Date('2026-08-16T09:00:00.000Z'),
    );
    expect(trackEvent).toHaveBeenCalledWith('streak_day_unlocked', { count: 1 });
    expect(api?.visible).toBe(true);

    act(() => {
      api?.dismiss();
    });
    expect(api?.visible).toBe(false);
  });

  it('ignores invalid completedAt values', async () => {
    let api: ReturnType<typeof useStreakCelebration> | undefined;
    function Probe() {
      api = useStreakCelebration({ completedAt: 'not-a-date', userId: 'user-1' });
      return null;
    }
    await act(async () => {
      ReactTestRenderer.create(<Probe />);
    });
    expect(store.recordPracticeDay).not.toHaveBeenCalled();
    expect(api?.visible).toBe(false);
  });

  it('stays hidden when the day was already recorded', async () => {
    store.recordPracticeDay.mockResolvedValue({
      shouldCelebrate: false,
      consecutive: 1,
      heading: '1 day streak',
      practiceDates: ['2026-08-16'],
      week: [],
    });

    function Probe() {
      useStreakCelebration({ completedAt: '2026-08-16T09:00:00.000Z', userId: 'user-1' });
      return null;
    }

    await act(async () => {
      ReactTestRenderer.create(<Probe />);
      await Promise.resolve();
    });
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('records against a local owner when userId is missing', async () => {
    store.recordPracticeDay.mockResolvedValue({
      shouldCelebrate: false,
      consecutive: 0,
      heading: '0 day streak',
      practiceDates: [],
      week: [],
    });

    function Probe() {
      useStreakCelebration({ completedAt: '2026-08-16T09:00:00.000Z' });
      return null;
    }

    await act(async () => {
      ReactTestRenderer.create(<Probe />);
      await Promise.resolve();
    });
    expect(store.recordPracticeDay).toHaveBeenCalledWith(
      'local',
      new Date('2026-08-16T09:00:00.000Z'),
    );
  });
});
