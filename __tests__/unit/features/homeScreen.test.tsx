import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { HomeScreen } from '@/features/home/screens/HomeScreen';

const mockNavigate = jest.fn();
const mockSelectTab = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual(
    '@react-navigation/native',
  ) as typeof import('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

jest.mock('@/app/navigation/useMainTabSelect', () => ({
  useMainTabSelect: () => mockSelectTab,
}));

jest.mock('@/core/auth/AuthProvider', () => ({
  useAuth: jest.fn(() => ({
    profile: { display_name: '  Tan Labs  ' },
  })),
}));

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(),
}));

jest.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: jest.fn(() => ({ data: null })),
}));

jest.mock('@/features/grammar/hooks', () => ({
  useGrammarTopics: jest.fn(),
  useGrammarProgress: jest.fn(),
  useGrammarContinueLearning: jest.fn(),
}));

jest.mock('@/features/vocabulary/hooks/useVocabularyProgress', () => ({
  useVocabularyProgress: jest.fn(),
}));

jest.mock('@/features/vocabulary/hooks', () => ({
  useVocabularyWeakProgress: jest.fn(() => ({ data: [] })),
}));

const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
  useFeatureFlags: jest.Mock;
};
const grammarHooks = jest.requireMock('@/features/grammar/hooks') as {
  useGrammarTopics: jest.Mock;
  useGrammarProgress: jest.Mock;
  useGrammarContinueLearning: jest.Mock;
};
const { useVocabularyProgress } = jest.requireMock(
  '@/features/vocabulary/hooks/useVocabularyProgress',
) as { useVocabularyProgress: jest.Mock };
const { useVocabularyWeakProgress } = jest.requireMock('@/features/vocabulary/hooks') as {
  useVocabularyWeakProgress: jest.Mock;
};

function idleContinue() {
  grammarHooks.useGrammarContinueLearning.mockReturnValue({
    target: null,
    isReady: true,
    lessonTitle: undefined,
    topicTitle: undefined,
    lessonPosition: null,
  });
}

describe('HomeScreen greeting + feature labels', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockNavigate.mockReset();
    mockSelectTab.mockReset();
  });

  it('renders greetings and enabled/disabled feature rows', async () => {
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
    useFeatureFlags.mockReturnValue({ data: { grammar: false, vocabulary: false } });
    grammarHooks.useGrammarTopics.mockReturnValue({
      data: [],
      isLoading: false,
      isSuccess: true,
    });
    grammarHooks.useGrammarProgress.mockReturnValue({ data: [] });
    idleContinue();
    useVocabularyProgress.mockReturnValue({
      overallLabel: '0 / 0',
      ready: true,
      situations: [],
      libraryKnown: 0,
      libraryTotal: 0,
      libraryRatio: 0,
    });
    useVocabularyWeakProgress.mockReturnValue({ data: [] });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<HomeScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Good morning')),
    ).toBe(true);
    expect(root.root.findAllByProps({ testID: 'home-continue' })).toHaveLength(0);
    expect(root.root.findAllByProps({ testID: 'home-review-needed' })).toHaveLength(0);

    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
    await act(() => {
      root.unmount();
      root = ReactTestRenderer.create(<HomeScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Good afternoon')),
    ).toBe(true);

    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(20);
    await act(() => {
      root.unmount();
      root = ReactTestRenderer.create(<HomeScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Good evening')),
    ).toBe(true);

    useFeatureFlags.mockReturnValue({ data: { grammar: true, vocabulary: true } });
    grammarHooks.useGrammarTopics.mockReturnValue({
      data: [{ id: 't1', lessonCount: 2 }],
      isLoading: true,
      isSuccess: false,
    });
    useVocabularyProgress.mockReturnValue({
      overallLabel: '3 / 10',
      ready: false,
      situations: [],
      libraryKnown: 0,
      libraryTotal: 2500,
      libraryRatio: 0,
    });
    await act(() => {
      root.unmount();
      root = ReactTestRenderer.create(<HomeScreen />);
    });
    expect(root.root.findByProps({ testID: 'home-open-grammar' })).toBeTruthy();
    expect(root.root.findByProps({ testID: 'home-open-vocabulary' })).toBeTruthy();

    grammarHooks.useGrammarTopics.mockReturnValue({
      data: [
        { id: 't1', lessonCount: 2 },
        { id: 't2', lessonCount: 1 },
      ],
      isLoading: false,
      isSuccess: true,
    });
    grammarHooks.useGrammarProgress.mockReturnValue({
      data: [
        { topicId: 't1', lessonId: 'l1', status: 'completed' },
        { topicId: 't1', lessonId: 'l2', status: 'completed' },
      ],
    });
    useVocabularyProgress.mockReturnValue({
      overallLabel: '3 / 10',
      ready: true,
      situations: [{ id: 's1' }],
      libraryKnown: 120,
      libraryTotal: 2500,
      libraryRatio: 120 / 2500,
    });
    await act(() => {
      root.update(<HomeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'home-open-grammar' }).props.onPress();
      root.root.findByProps({ testID: 'home-open-vocabulary' }).props.onPress();
    });
    expect(mockSelectTab).toHaveBeenCalledWith('grammar');
    expect(mockSelectTab).toHaveBeenCalledWith('vocabulary');

    grammarHooks.useGrammarTopics.mockReturnValue({
      data: [],
      isLoading: false,
      isSuccess: true,
    });
    await act(() => {
      root.update(<HomeScreen />);
    });
  });

  it('opens continue learning and weak-item review from Home', async () => {
    useFeatureFlags.mockReturnValue({ data: { grammar: true, vocabulary: true } });
    grammarHooks.useGrammarTopics.mockReturnValue({
      data: [{ id: 't1', lessonCount: 3 }],
      isLoading: false,
      isSuccess: true,
    });
    grammarHooks.useGrammarProgress.mockReturnValue({ data: [] });
    grammarHooks.useGrammarContinueLearning.mockReturnValue({
      isReady: true,
      target: { topicId: 't1', lessonId: 'l2' },
      lessonTitle: 'Negative & Questions',
      topicTitle: 'Past Simple',
      lessonPosition: { current: 1, total: 3 },
    });
    useVocabularyProgress.mockReturnValue({
      ready: true,
      libraryKnown: 3,
      libraryTotal: 2500,
      libraryRatio: 0.001,
    });
    useVocabularyWeakProgress.mockReturnValue({
      data: [{ itemId: 'a' }, { itemId: 'b' }, { itemId: 'c' }],
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<HomeScreen />);
    });

    expect(
      root.root.findAllByType(Text).some((node) => node.props.children === 'Negative & Questions'),
    ).toBe(true);
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => node.props.children === '3 vocabulary items need practice'),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'home-continue' }).props.onPress();
      root.root.findByProps({ testID: 'home-review-needed' }).props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Grammar', {
      screen: 'GrammarLesson',
      params: { topicId: 't1', lessonId: 'l2' },
    });
    expect(mockNavigate).toHaveBeenCalledWith('Vocabulary', {
      screen: 'VocabularyWeak',
    });

    grammarHooks.useGrammarContinueLearning.mockReturnValue({
      isReady: true,
      target: { topicId: 't1', lessonId: 'l2' },
      lessonTitle: 'Negative & Questions',
      topicTitle: 'Past Simple',
      lessonPosition: null,
    });
    useVocabularyWeakProgress.mockReturnValue({ data: [{ itemId: 'a' }] });
    await act(() => {
      root.update(<HomeScreen />);
    });
    expect(root.root.findAllByType(Text).some((node) => node.props.children === 'Continue')).toBe(
      true,
    );
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => node.props.children === '1 vocabulary item needs practice'),
    ).toBe(true);

    const continueCard = root.root.findByProps({ testID: 'home-continue' });
    const reviewCard = root.root.findByProps({ testID: 'home-review-needed' });
    if (typeof continueCard.props.style === 'function') {
      continueCard.props.style({ pressed: true });
      continueCard.props.style({ pressed: false });
    }
    if (typeof reviewCard.props.style === 'function') {
      reviewCard.props.style({ pressed: true });
      reviewCard.props.style({ pressed: false });
    }
  });
});
