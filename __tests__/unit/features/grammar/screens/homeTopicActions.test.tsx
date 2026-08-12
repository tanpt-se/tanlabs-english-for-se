import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { GrammarHomeScreen } from '@/features/grammar/screens/GrammarHomeScreen';
import { GrammarTopicScreen } from '@/features/grammar/screens/GrammarTopicScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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
    useRoute: () => ({
      params: { topicId: 'topic-1' },
    }),
  };
});

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(() => ({ data: { grammar: true } })),
}));

jest.mock('@/features/grammar/hooks', () => ({
  grammarErrorMessage: jest.fn((_err: unknown, fallback: string) => fallback),
  useGrammarTopics: jest.fn(),
  useGrammarProgress: jest.fn(),
  useGrammarContinueLearning: jest.fn(),
  useGrammarTopic: jest.fn(),
  useGrammarLessons: jest.fn(),
}));

const hooks = jest.requireMock('@/features/grammar/hooks') as {
  useGrammarTopics: jest.Mock;
  useGrammarProgress: jest.Mock;
  useGrammarContinueLearning: jest.Mock;
  useGrammarTopic: jest.Mock;
  useGrammarLessons: jest.Mock;
};

describe('grammar home/topic actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hooks.useGrammarLessons.mockReturnValue({ data: [], isLoading: false, isError: false });
    hooks.useGrammarTopic.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(async () => undefined),
    });
    hooks.useGrammarProgress.mockReturnValue({
      data: [],
      refetch: jest.fn(async () => undefined),
    });
    hooks.useGrammarContinueLearning.mockReturnValue({
      target: null,
      topicTitle: undefined,
      lessonTitle: undefined,
      isLoading: false,
      isReady: false,
    });
  });

  it('navigates from home continue and topic row actions', async () => {
    hooks.useGrammarTopics.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'topic-1',
          slug: 'present-simple',
          title: 'Present Simple',
          description: 'Habits',
          sortOrder: 1,
          lessonCount: 4,
        },
      ],
      refetch: jest.fn(async () => undefined),
    });
    hooks.useGrammarProgress.mockReturnValue({
      data: [],
      refetch: jest.fn(async () => undefined),
    });
    hooks.useGrammarContinueLearning.mockReturnValue({
      target: { topicId: 'topic-1', lessonId: 'lesson-2' },
      topicTitle: 'Present Simple',
      lessonTitle: 'A2 · Habits',
      isLoading: false,
      isReady: true,
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarHomeScreen />);
    });

    await act(() => {
      root.root.findByProps({ testID: 'grammar-home-continue' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarLesson', {
      topicId: 'topic-1',
      lessonId: 'lesson-2',
    });

    await act(() => {
      root.root.findByProps({ testID: 'grammar-topic-present-simple' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarTopic', { topicId: 'topic-1' });
  });

  it('retries topic loading and uses topic footer/header actions', async () => {
    const refetchTopic = jest.fn(async () => undefined);
    const refetchLessons = jest.fn(async () => undefined);
    const refetchProgress = jest.fn(async () => undefined);
    hooks.useGrammarProgress.mockReturnValue({
      data: [{ lessonId: 'lesson-1', topicId: 'topic-1', status: 'in_progress', bestScore: 65 }],
      refetch: refetchProgress,
    });
    hooks.useGrammarTopic.mockReturnValue({
      isLoading: false,
      isError: true,
      error: new Error('down'),
      data: {
        id: 'topic-1',
        title: 'Present Simple',
        description: 'Habits',
        slug: 'present-simple',
      },
      refetch: refetchTopic,
    });
    hooks.useGrammarLessons.mockReturnValue({
      isLoading: false,
      isError: true,
      isSuccess: true,
      data: [
        { id: 'lesson-1', sortOrder: 1, slug: 'ps-a2', title: 'A2', description: '', level: 'A2' },
      ],
      refetch: refetchLessons,
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarTopicScreen />);
    });

    expect(root.root.findAllByType(Text).some((node) => node.props.children === 'Retry')).toBe(
      true,
    );

    const header = root.root.findByProps({ title: 'Present Simple' });
    await act(() => {
      header.props.onBackPress();
    });
    expect(mockGoBack).toHaveBeenCalled();

    await act(() => {
      root.root.findByProps({ testID: 'grammar-topic-continue' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarLesson', {
      topicId: 'topic-1',
      lessonId: 'lesson-1',
    });
  });
});
