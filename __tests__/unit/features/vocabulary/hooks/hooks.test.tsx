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
  useVocabularySituationItems,
  useVocabularyTerm,
  useVocabularyWeakExercises,
  useVocabularyWeakProgress,
} from '@/features/vocabulary/hooks/useVocabularyQueries';

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

jest.mock('@/features/vocabulary/services', () => ({
  getSituations: jest.fn(async () => [
    {
      id: 'task-progress',
      slug: 'task-progress',
      title: 'Task & Progress',
      description: 'Status',
      total: 10,
      itemIds: ['task-progress:blocker'],
    },
  ]),
  getSituation: jest.fn(async () => null),
  getSituationExercises: jest.fn(async () => []),
  getSituationItems: jest.fn(async () => null),
  getVocabularyTerm: jest.fn(async () => null),
  getExercisesForItemIds: jest.fn(async () => []),
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
    let weakExercises!: ReturnType<typeof useVocabularyWeakExercises>;
    let result!: ReturnType<typeof useVocabularyResultSession>;
    let complete!: ReturnType<typeof useCompleteVocabularyAttempt>;
    let progress!: ReturnType<typeof useVocabularyProgress>;
    let items!: ReturnType<typeof useVocabularySituationItems>;
    let term!: ReturnType<typeof useVocabularyTerm>;

    function Probe() {
      situations = useVocabularySituations();
      situation = useVocabularySituation('task-progress');
      exercises = useVocabularyExercises('task-progress');
      weak = useVocabularyWeakProgress();
      weakExercises = useVocabularyWeakExercises(['task-progress:blocker']);
      result = useVocabularyResultSession('attempt-1');
      complete = useCompleteVocabularyAttempt();
      progress = useVocabularyProgress();
      items = useVocabularySituationItems('task-progress');
      term = useVocabularyTerm('task-progress', 'task-progress:blocker');
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
    expect(weakExercises).toBeTruthy();
    expect(result.session).toBeNull();
    expect(typeof complete.mutate).toBe('function');
    expect(progress.situations.length).toBeGreaterThan(0);
    expect(items).toBeTruthy();
    expect(term).toBeTruthy();
  });
});
