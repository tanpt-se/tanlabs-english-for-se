import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { SituationDetailScreen } from '@/features/vocabulary/screens/SituationDetailScreen';
import { TermDetailScreen } from '@/features/vocabulary/screens/TermDetailScreen';
import { VocabularyHomeScreen } from '@/features/vocabulary/screens/VocabularyHomeScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const routeParams: { situationId: string; itemId?: string } = {
  situationId: 'task-progress',
  itemId: 'task-progress:tp-2',
};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(() => ({ data: { vocabulary: true } })),
}));

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
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
    }),
    useRoute: () => ({ params: routeParams }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      ReactLib.useEffect(effect, [effect]);
    },
  };
});

jest.mock('@/features/vocabulary/data/knownItemsStore', () => ({
  loadKnownItemIds: jest.fn(async () => new Set<string>(['task-progress:tp-2'])),
  toggleItemKnown: jest.fn(async () => true),
}));

const SITUATION_ITEMS = {
  situation: {
    id: 'task-progress',
    slug: 'task-progress',
    title: 'Task & Progress',
    description: 'Status talk',
    total: 2,
    itemIds: ['task-progress:tp-2', 'task-progress:ship'],
  },
  items: [
    {
      id: 'task-progress:tp-2',
      text: 'blocker',
      tag: 'A2',
      level: 'A2',
      pos: 'expr',
      needsPractice: true,
    },
    {
      id: 'task-progress:ship',
      text: 'ship',
      tag: 'B1',
      level: 'B1',
      pos: 'v',
      needsPractice: false,
    },
  ],
  shown: 2,
  total: 2,
  capped: false,
  levelTotals: { A2: 1, B1: 1, B2: 0, C1: 0 },
};

const TERM_DETAIL = {
  id: 'task-progress:tp-2',
  situationId: 'task-progress',
  term: 'blocker',
  type: 'expression',
  pos: 'expr',
  level: 'A2',
  meaning: 'Something that stops progress',
  context: 'Standup',
  patterns: ['be blocked by'],
  examples: [
    { label: 'standup', sentence: 'I am blocked.' },
    { label: '', sentence: 'Still blocked.' },
  ],
  alternatives: ['stuck'],
  notes: ['Use in standup'],
};

jest.mock('@/features/vocabulary/hooks/useVocabularyQueries', () => {
  const actual = jest.requireActual(
    '@/features/vocabulary/hooks/useVocabularyQueries',
  ) as typeof import('@/features/vocabulary/hooks/useVocabularyQueries');
  return {
    ...actual,
    useVocabularyWeakProgress: jest.fn(() => ({
      data: [{ itemId: 'task-progress:blocker', incorrectCount: 2, correctCount: 0 }],
      isLoading: false,
      isError: false,
      refetch: jest.fn(async () => undefined),
    })),
    useVocabularySituationItems: jest.fn(() => ({
      data: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(async () => undefined),
    })),
    useVocabularyTerm: jest.fn(() => ({
      data: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(async () => undefined),
    })),
  };
});

jest.mock('@/features/vocabulary/hooks/useVocabularyProgress', () => ({
  useVocabularyProgress: jest.fn(() => ({
    situations: [
      {
        id: 'task-progress',
        slug: 'task-progress',
        title: 'Task & Progress',
        description: 'x',
        learned: 1,
        total: 10,
        progressLabel: '1 / 10',
        progressRatio: 0.1,
      },
    ],
    totalKnown: 1,
    totalTerms: 10,
    overallLabel: '1 / 10',
    overallRatio: 0.1,
    ready: true,
    isError: false,
    refresh: jest.fn(async () => undefined),
  })),
}));

const { loadKnownItemIds, toggleItemKnown } = jest.requireMock(
  '@/features/vocabulary/data/knownItemsStore',
) as {
  loadKnownItemIds: jest.Mock;
  toggleItemKnown: jest.Mock;
};
const { useVocabularyProgress } = jest.requireMock(
  '@/features/vocabulary/hooks/useVocabularyProgress',
) as { useVocabularyProgress: jest.Mock };
const { useVocabularySituationItems, useVocabularyTerm, useVocabularyWeakProgress } =
  jest.requireMock('@/features/vocabulary/hooks/useVocabularyQueries') as {
    useVocabularySituationItems: jest.Mock;
    useVocabularyTerm: jest.Mock;
    useVocabularyWeakProgress: jest.Mock;
  };

describe('vocabulary detail/home branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    routeParams.situationId = 'task-progress';
    routeParams.itemId = 'task-progress:tp-2';
    loadKnownItemIds.mockResolvedValue(new Set(['task-progress:tp-2']));
    toggleItemKnown.mockResolvedValue(true);
    useVocabularySituationItems.mockReturnValue({
      data: SITUATION_ITEMS,
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
      refetch: jest.fn(async () => undefined),
    });
    useVocabularyTerm.mockReturnValue({
      data: TERM_DETAIL,
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
      refetch: jest.fn(async () => undefined),
    });
  });

  it('filters, collapses levels, navigates, and toggles known', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<SituationDetailScreen />);
      await Promise.resolve();
      await Promise.resolve();
    });

    const filter = root.root.findByProps({ testID: 'vocabulary-filter' });
    await act(() => {
      filter.props.onChange('known');
    });
    await act(() => {
      filter.props.onChange('learning');
    });
    await act(() => {
      filter.props.onChange('all');
    });

    await act(() => {
      root.root.findByProps({ testID: 'level-section-A2' }).props.onPress();
    });
    await act(() => {
      root.root.findByProps({ testID: 'level-section-A2' }).props.onPress();
    });

    const knownToggle = root.root.findAll(
      (node) =>
        typeof node.props?.testID === 'string' && node.props.testID.startsWith('known-toggle-'),
    )[0];
    expect(knownToggle).toBeTruthy();
    toggleItemKnown.mockResolvedValueOnce(false);
    await act(() => {
      knownToggle!.props.onPress();
    });
    expect(toggleItemKnown).toHaveBeenCalled();

    await act(() => {
      const row = root.root.find(
        (node) =>
          node.props?.accessibilityRole === 'button' &&
          typeof node.props?.accessibilityLabel === 'string' &&
          String(node.props.accessibilityLabel).startsWith('blocker'),
      );
      row.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      'VocabularyTerm',
      expect.objectContaining({ situationId: 'task-progress' }),
    );

    await act(() => {
      root.root.findByProps({ testID: 'practice-cta' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      'VocabularyPracticeFlow',
      expect.objectContaining({ screen: 'VocabularyPractice' }),
    );

    await act(() => {
      root.root.findByProps({ showBack: true }).props.onBackPress();
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows empty known filter, capped meta, and situation fallbacks', async () => {
    loadKnownItemIds.mockResolvedValue(new Set());
    useVocabularySituationItems.mockReturnValue({
      data: {
        situation: undefined,
        items: [
          {
            id: 'task-progress:tp-2',
            text: 'blocker',
            tag: 'A2',
            level: 'A2',
            pos: 'expr',
          },
        ],
        shown: 2,
        total: 40,
        capped: true,
        levelTotals: { A2: 1 },
      },
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(async () => undefined),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<SituationDetailScreen />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Situation')),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-filter' }).props.onChange('known');
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('No known terms yet')),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-filter' }).props.onChange('learning');
    });
  });

  it('toggles known on term detail and covers sparse/missing term branches', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<TermDetailScreen />);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(root.root.findByProps({ testID: 'vocabulary-term' })).toBeTruthy();
    await act(() => {
      root.root.findByProps({ testID: 'term-known-cta' }).props.onPress();
    });
    expect(toggleItemKnown).toHaveBeenCalled();
    expect(root.root.findByProps({ testID: 'term-known-cta' }).props.label).toMatch(
      /Marked known|Mark as known/,
    );

    useVocabularyTerm.mockReturnValue({
      data: {
        id: 'task-progress:sparse',
        situationId: 'task-progress',
        term: 'sparse',
        type: 'word',
        pos: 'n',
        level: 'B1',
        meaning: 'Thin entry',
        context: 'Docs',
        patterns: [],
        examples: [],
        alternatives: [],
        notes: [],
      },
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(async () => undefined),
    });
    await act(() => {
      root.update(<TermDetailScreen />);
      return Promise.resolve();
    });
    expect(root.root.findByProps({ testID: 'vocabulary-term' })).toBeTruthy();

    routeParams.itemId = 'missing';
    useVocabularyTerm.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      isSuccess: true,
      refetch: jest.fn(async () => undefined),
    });
    await act(() => {
      root.update(<TermDetailScreen />);
    });
    expect(root.root.findByProps({ testID: 'vocabulary-term-missing' })).toBeTruthy();
    await act(() => {
      root.root.findByProps({ showBack: true }).props.onBackPress();
    });
  });

  it('opens weak items from home and retries empty state', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<VocabularyHomeScreen />);
      await Promise.resolve();
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-open-weak' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyWeak');

    const refresh = jest.fn(async () => undefined);
    useVocabularyProgress.mockReturnValue({
      situations: [],
      totalKnown: 0,
      totalTerms: 0,
      overallLabel: '0 / 0',
      overallRatio: 0,
      ready: true,
      isError: false,
      refresh,
    });
    await act(() => {
      root.update(<VocabularyHomeScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('No situations')),
    ).toBe(true);
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-home-retry' }).props.onPress();
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('covers catalog loading, error retry, and home error retry', async () => {
    const refetchItems = jest.fn(async () => undefined);
    useVocabularySituationItems.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
      refetch: refetchItems,
    });
    let situationRoot!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      situationRoot = ReactTestRenderer.create(<SituationDetailScreen />);
      await Promise.resolve();
    });
    expect(situationRoot.root.findByProps({ testID: 'vocabulary-situation-loading' })).toBeTruthy();

    useVocabularySituationItems.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: new Error('down'),
      refetch: refetchItems,
    });
    await act(() => {
      situationRoot.update(<SituationDetailScreen />);
    });
    await act(() => {
      situationRoot.root.findByProps({ testID: 'vocabulary-situation-retry' }).props.onPress();
    });
    expect(refetchItems).toHaveBeenCalled();

    const refetchTerm = jest.fn(async () => undefined);
    useVocabularyTerm.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
      refetch: refetchTerm,
    });
    let termRoot!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      termRoot = ReactTestRenderer.create(<TermDetailScreen />);
      await Promise.resolve();
    });
    expect(termRoot.root.findByProps({ testID: 'vocabulary-term-loading' })).toBeTruthy();

    useVocabularyTerm.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: new Error('down'),
      refetch: refetchTerm,
    });
    await act(() => {
      termRoot.update(<TermDetailScreen />);
    });
    await act(() => {
      termRoot.root.findByProps({ testID: 'vocabulary-term-retry' }).props.onPress();
    });
    expect(refetchTerm).toHaveBeenCalled();

    const refresh = jest.fn(async () => undefined);
    const refetchWeak = jest.fn(async () => undefined);
    useVocabularyWeakProgress.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: refetchWeak,
    });
    useVocabularyProgress.mockReturnValue({
      situations: [],
      totalKnown: 0,
      totalTerms: 0,
      overallLabel: '0 / 0',
      overallRatio: 0,
      ready: true,
      isError: true,
      refresh,
    });
    let homeRoot!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      homeRoot = ReactTestRenderer.create(<VocabularyHomeScreen />);
      await Promise.resolve();
    });
    await act(() => {
      homeRoot.root.findByProps({ testID: 'vocabulary-home-retry' }).props.onPress();
    });
    expect(refresh).toHaveBeenCalled();
    expect(refetchWeak).toHaveBeenCalled();
  });
});
