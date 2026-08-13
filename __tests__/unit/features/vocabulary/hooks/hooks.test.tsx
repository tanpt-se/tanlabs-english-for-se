import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { useVocabularyProgress } from '@/features/vocabulary/hooks/useVocabularyProgress';
import {
  useCompleteVocabularyAttempt,
  useVocabularyExercises,
  useVocabularyResultSession,
  useVocabularySituation,
  useVocabularySituations,
  useVocabularyWeakProgress,
} from '@/features/vocabulary/hooks/useVocabularyQueries';

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

jest.mock('@/features/vocabulary/services', () => ({
  getSituations: jest.fn(async () => []),
  getSituation: jest.fn(async () => null),
  getSituationExercises: jest.fn(async () => []),
  getWeakProgress: jest.fn(async () => []),
}));

jest.mock('@/features/vocabulary/data/knownItemsStore', () => ({
  loadKnownItemIds: jest.fn(async () => new Set(['task-progress:blocker'])),
}));

jest.mock('@/features/vocabulary/session', () => ({
  usePracticeSession: jest.fn(() => ({
    getCompletedSession: jest.fn(() => null),
  })),
}));

jest.mock('@/features/vocabulary/session/completedSessionCache', () => ({
  loadCompletedSession: jest.fn(async () => null),
}));

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react') as typeof import('react');
  return {
    useFocusEffect: (effect: () => void | (() => void)) => {
      ReactLib.useEffect(effect, [effect]);
    },
  };
});

function wrap(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe('vocabulary hooks', () => {
  it('exposes query hooks without crashing', async () => {
    let situations!: ReturnType<typeof useVocabularySituations>;
    let situation!: ReturnType<typeof useVocabularySituation>;
    let exercises!: ReturnType<typeof useVocabularyExercises>;
    let weak!: ReturnType<typeof useVocabularyWeakProgress>;
    let result!: ReturnType<typeof useVocabularyResultSession>;
    let complete!: ReturnType<typeof useCompleteVocabularyAttempt>;
    let progress!: ReturnType<typeof useVocabularyProgress>;

    function Probe() {
      situations = useVocabularySituations();
      situation = useVocabularySituation('task-progress');
      exercises = useVocabularyExercises('task-progress');
      weak = useVocabularyWeakProgress();
      result = useVocabularyResultSession('attempt-1');
      complete = useCompleteVocabularyAttempt();
      progress = useVocabularyProgress();
      return null;
    }

    await act(async () => {
      ReactTestRenderer.create(wrap(<Probe />));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(situations).toBeTruthy();
    expect(situation).toBeTruthy();
    expect(exercises).toBeTruthy();
    expect(weak).toBeTruthy();
    expect(result.session).toBeNull();
    expect(typeof complete.mutate).toBe('function');
    expect(progress.situations.length).toBeGreaterThan(0);
  });
});
