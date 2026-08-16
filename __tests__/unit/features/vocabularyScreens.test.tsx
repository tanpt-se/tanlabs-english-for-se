import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { SituationDetailScreen } from '@/features/vocabulary/screens/SituationDetailScreen';
import { TermDetailScreen } from '@/features/vocabulary/screens/TermDetailScreen';
import { VocabularyHomeScreen } from '@/features/vocabulary/screens/VocabularyHomeScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();
const routeParams: {
  situationId: string;
  itemId?: string;
  correct: number;
  total: number;
} = {
  situationId: 'task-progress',
  correct: 7,
  total: 10,
};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react') as typeof import('react');
  const actual = jest.requireActual(
    '@react-navigation/native',
  ) as typeof import('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      replace: mockReplace,
    }),
    useRoute: () => ({
      params: routeParams,
    }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      ReactLib.useEffect(effect, [effect]);
    },
  };
});

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(() => ({ data: { vocabulary: true } })),
}));

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
}));

const TASK_EXPRESSION = {
  id: 'task-progress:tp-2',
  text: "I'm blocked by the API dependency.",
  tag: 'expression · A2',
  level: 'A2' as const,
  pos: 'expr' as const,
  needsPractice: true,
};

const TASK_TERM = {
  id: 'task-progress:tp-2',
  situationId: 'task-progress',
  term: "I'm blocked by the API dependency.",
  type: 'expression' as const,
  pos: 'expr' as const,
  level: 'A2' as const,
  meaning: 'Name a blocker that stops progress.',
  context: 'Blocker',
  patterns: [],
  examples: [{ label: 'Example', sentence: "I'm blocked by the API dependency." }],
  alternatives: [],
  notes: [],
  pronunciation: 'BLOK-er',
  countability: 'both' as const,
};

const TASK_CATALOG = {
  situation: {
    id: 'task-progress',
    slug: 'task-progress',
    title: 'Task & Progress',
    description: 'Status, ownership, next steps',
    total: 10,
    itemIds: ['task-progress:tp-2'],
    coreItemIds: ['task-progress:tp-2'],
  },
  items: [TASK_EXPRESSION],
  coreItems: [TASK_EXPRESSION],
  shown: 1,
  total: 10,
  capped: false,
  levelTotals: { A2: 1 },
};

jest.mock('@/features/vocabulary/hooks/useVocabularyProgress', () => ({
  useVocabularyProgress: jest.fn(() => ({
    situations: [
      {
        id: 'task-progress',
        slug: 'task-progress',
        title: 'Task & Progress',
        description: 'Status, ownership, next steps',
        learned: 0,
        total: 10,
        progressLabel: '0 / 10',
        progressRatio: 0,
      },
    ],
    totalKnown: 0,
    totalTerms: 10,
    overallLabel: '0 / 10',
    overallRatio: 0,
    ready: true,
    isError: false,
    refresh: jest.fn(async () => undefined),
    continueTarget: {
      id: 'task-progress:tp-2',
      situationId: 'task-progress',
      title: 'Task & Progress',
    },
    libraryTotal: 2500,
    libraryKnown: 0,
    libraryRatio: 0,
  })),
}));

jest.mock('@/features/vocabulary/hooks/useVocabularyQueries', () => {
  const actual = jest.requireActual(
    '@/features/vocabulary/hooks/useVocabularyQueries',
  ) as typeof import('@/features/vocabulary/hooks/useVocabularyQueries');
  return {
    ...actual,
    useVocabularyWeakProgress: jest.fn(() => ({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })),
    useVocabularySituationItems: jest.fn(() => ({
      data: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    })),
    useVocabularyTerm: jest.fn(() => ({
      data: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    })),
  };
});

jest.mock('@/features/vocabulary/data/knownItemsStore', () => ({
  loadKnownItemIds: jest.fn(async () => new Set<string>()),
  toggleItemKnown: jest.fn(async () => true),
  markItemsKnown: jest.fn(async () => undefined),
}));

const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
  useFeatureFlags: jest.Mock;
};
const { useVocabularySituationItems, useVocabularyTerm } = jest.requireMock(
  '@/features/vocabulary/hooks/useVocabularyQueries',
) as { useVocabularySituationItems: jest.Mock; useVocabularyTerm: jest.Mock };

describe('vocabulary screen skeleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFeatureFlags.mockReturnValue({ data: { vocabulary: true } });
    routeParams.situationId = 'task-progress';
    routeParams.itemId = undefined;
    routeParams.correct = 7;
    routeParams.total = 10;
    useVocabularySituationItems.mockReturnValue({
      data: TASK_CATALOG,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    });
    useVocabularyTerm.mockReturnValue({
      data: TASK_TERM,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    });
  });

  it('lists situations and opens a situation', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<VocabularyHomeScreen />);
      await Promise.resolve();
    });
    expect(
      root.root.findAllByType(Text).some((node) => node.props.children === 'Vocabulary situations'),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ accessibilityLabel: 'Task & Progress, 0 / 10' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularySituation', {
      situationId: 'task-progress',
    });
  });

  it('opens the library from home', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<VocabularyHomeScreen />);
      await Promise.resolve();
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-open-library' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyLibrary', {});
  });

  it('redirects home when vocabulary flag is off', async () => {
    useFeatureFlags.mockReturnValue({ data: { vocabulary: false } });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<VocabularyHomeScreen />);
    });
    expect(root.toJSON()).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('shows the core list, browse-all, and a 5–8 question practice CTA', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<SituationDetailScreen />);
      await Promise.resolve();
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => node.props.children === "I'm blocked by the API dependency."),
    ).toBe(true);
    expect(root.root.findByProps({ testID: 'vocabulary-browse-all' })).toBeTruthy();

    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Practice 5 questions')),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'practice-cta' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyPracticeFlow', {
      screen: 'VocabularyPractice',
      params: { situationId: 'task-progress', mode: 'situation' },
    });

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-situation-continue' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyTerm', {
      situationId: 'task-progress',
      itemId: 'task-progress:tp-2',
    });

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-browse-all' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyLibrary', {
      situationId: 'task-progress',
    });
  });

  it('opens term detail from a row', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<SituationDetailScreen />);
      await Promise.resolve();
    });

    await act(() => {
      root.root
        .findByProps({
          accessibilityLabel: "I'm blocked by the API dependency., expr. Learning",
        })
        .props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyTerm', {
      situationId: 'task-progress',
      itemId: 'task-progress:tp-2',
    });
  });

  it('renders Cambridge-style term detail', async () => {
    routeParams.situationId = 'task-progress';
    routeParams.itemId = 'task-progress:tp-2';

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<TermDetailScreen />);
      await Promise.resolve();
    });
    const labels = root.root.findAllByType(Text).map((node) => String(node.props.children));
    expect(labels).toEqual(
      expect.arrayContaining([
        "I'm blocked by the API dependency.",
        'Definition',
        'Name a blocker that stops progress.',
        'Examples',
        'WORKPLACE ENGLISH',
      ]),
    );
  });

  // TODO: covered by __tests__/unit/features/vocabulary/screens/practice*.test.tsx

  it('falls back when situation id is unknown', async () => {
    routeParams.situationId = 'missing';
    useVocabularySituationItems.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(),
    });

    let detail!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      detail = ReactTestRenderer.create(<SituationDetailScreen />);
    });
    expect(
      detail.root.findAllByType(Text).some((node) => node.props.children === 'Situation'),
    ).toBe(true);
  });
});
