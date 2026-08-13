import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { WeakItemsScreen } from '@/features/vocabulary/screens/WeakItemsScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/core/analytics/events', () => ({
  trackEvent: jest.fn(async () => undefined),
}));

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(() => ({ data: { vocabulary: true } })),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual(
    '@react-navigation/native',
  ) as typeof import('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

jest.mock('@/features/vocabulary/data/localPackCatalog', () => ({
  resolveLocalItemLabel: jest.fn((id: string) => `label:${id}`),
}));

jest.mock('@/features/vocabulary/hooks', () => ({
  useVocabularyWeakProgress: jest.fn(),
  useVocabularySituations: jest.fn(),
}));

const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
  useFeatureFlags: jest.Mock;
};
const hooks = jest.requireMock('@/features/vocabulary/hooks') as {
  useVocabularyWeakProgress: jest.Mock;
  useVocabularySituations: jest.Mock;
};

describe('WeakItemsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFeatureFlags.mockReturnValue({ data: { vocabulary: true } });
    hooks.useVocabularySituations.mockReturnValue({
      data: [{ id: 'task-progress', slug: 'task-progress', title: 'Task', total: 10 }],
    });
    hooks.useVocabularyWeakProgress.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          itemId: 'task-progress:blocker',
          incorrectCount: 3,
          correctCount: 1,
          lastResult: false,
          lastSeenAt: 'x',
          sortOrder: 0,
        },
      ],
      refetch: jest.fn(),
    });
  });

  it('lists weak items and starts weak practice', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<WeakItemsScreen />);
    });
    expect(root.root.findByProps({ testID: 'vocabulary-weak' })).toBeTruthy();
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('label:task-progress:blocker')),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-weak-practice' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyPracticeFlow', {
      screen: 'VocabularyPractice',
      params: { situationId: 'task-progress', mode: 'weak' },
    });
  });

  it('handles loading, error, empty, and disabled flag', async () => {
    hooks.useVocabularyWeakProgress.mockReturnValue({
      isLoading: true,
      isError: false,
      data: [],
      refetch: jest.fn(),
    });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<WeakItemsScreen />);
    });
    expect(root.root.findByProps({ testID: 'vocabulary-weak-loading' })).toBeTruthy();

    const refetch = jest.fn();
    hooks.useVocabularyWeakProgress.mockReturnValue({
      isLoading: false,
      isError: true,
      data: [],
      refetch,
    });
    await act(() => {
      root.update(<WeakItemsScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-weak-retry' }).props.onPress();
    });
    expect(refetch).toHaveBeenCalled();

    hooks.useVocabularyWeakProgress.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: jest.fn(),
    });
    await act(() => {
      root.update(<WeakItemsScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('No weak expressions')),
    ).toBe(true);

    useFeatureFlags.mockReturnValue({ data: { vocabulary: false } });
    await act(() => {
      root.update(<WeakItemsScreen />);
    });
    expect(root.toJSON()).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyHome');
  });
});
