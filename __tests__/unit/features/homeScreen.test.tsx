import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { HomeScreen } from '@/features/home/screens/HomeScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/app/navigation/useMainTabSelect', () => ({
  useMainTabSelect: () => jest.fn(),
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
}));

jest.mock('@/features/vocabulary/hooks/useVocabularyProgress', () => ({
  useVocabularyProgress: jest.fn(),
}));

const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
  useFeatureFlags: jest.Mock;
};
const grammarHooks = jest.requireMock('@/features/grammar/hooks') as {
  useGrammarTopics: jest.Mock;
  useGrammarProgress: jest.Mock;
};
const { useVocabularyProgress } = jest.requireMock(
  '@/features/vocabulary/hooks/useVocabularyProgress',
) as { useVocabularyProgress: jest.Mock };

describe('HomeScreen greeting + feature labels', () => {
  afterEach(() => {
    jest.restoreAllMocks();
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
    useVocabularyProgress.mockReturnValue({
      overallLabel: '0 / 0',
      ready: true,
      situations: [],
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<HomeScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Good morning')),
    ).toBe(true);

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
    });
    await act(() => {
      root.update(<HomeScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'home-open-grammar' }).props.onPress();
      root.root.findByProps({ testID: 'home-open-vocabulary' }).props.onPress();
    });

    grammarHooks.useGrammarTopics.mockReturnValue({
      data: [],
      isLoading: false,
      isSuccess: true,
    });
    await act(() => {
      root.update(<HomeScreen />);
    });
  });
});
