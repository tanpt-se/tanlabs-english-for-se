import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { GrammarCategoryScreen } from '@/features/grammar/screens/GrammarCategoryScreen';
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
      params: { topicId: 'topic-1', categorySlug: 'core-tenses' },
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

  it('opens a category from home and keeps topic rows enabled', async () => {
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
          lessonCount: 3,
          categorySlug: 'core-tenses',
          curriculumVersion: 2,
          isOptional: false,
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
      root.root.findByProps({ testID: 'grammar-category-core-tenses' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarCategory', {
      categorySlug: 'core-tenses',
    });

    await act(() => {
      root.update(<GrammarCategoryScreen />);
    });
    const topicRow = root.root.findByProps({ testID: 'grammar-topic-present-simple' });
    expect(topicRow.props.accessibilityState?.disabled).not.toBe(true);
    await act(() => {
      topicRow.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarTopic', { topicId: 'topic-1' });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-category-continue' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarTopic', { topicId: 'topic-1' });

    await act(() => {
      root.root.findByProps({ showBack: true }).props.onBackPress();
    });
    expect(mockGoBack).toHaveBeenCalled();
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

  it('retries category loading and keeps upcoming topics tappable', async () => {
    const refetchTopics = jest.fn(async () => undefined);
    const refetchProgress = jest.fn(async () => undefined);
    hooks.useGrammarTopics.mockReturnValue({
      isLoading: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      refetch: refetchTopics,
    });
    hooks.useGrammarProgress.mockReturnValue({
      data: [],
      refetch: refetchProgress,
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarCategoryScreen />);
    });
    expect(root.root.findByProps({ testID: 'grammar-category-loading' })).toBeTruthy();

    hooks.useGrammarTopics.mockReturnValue({
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: new Error('down'),
      data: undefined,
      refetch: refetchTopics,
    });
    await act(() => {
      root.update(<GrammarCategoryScreen />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'grammar-category-retry' }).props.onPress();
    });
    expect(refetchTopics).toHaveBeenCalled();
    expect(refetchProgress).toHaveBeenCalled();

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
          lessonCount: 3,
          categorySlug: 'core-tenses',
          curriculumVersion: 2,
          isOptional: false,
        },
        {
          id: 'topic-2',
          slug: 'present-continuous',
          title: 'Present Continuous',
          description: 'Now',
          sortOrder: 2,
          lessonCount: 3,
          categorySlug: 'core-tenses',
          curriculumVersion: 2,
          isOptional: false,
        },
      ],
      refetch: refetchTopics,
    });
    hooks.useGrammarProgress.mockReturnValue({
      data: [
        { lessonId: 'l1', topicId: 'topic-1', status: 'completed' },
        { lessonId: 'l2', topicId: 'topic-1', status: 'completed' },
        { lessonId: 'l3', topicId: 'topic-1', status: 'completed' },
        { lessonId: 'other', topicId: 'elsewhere', status: 'completed' },
      ],
      refetch: refetchProgress,
    });
    await act(() => {
      root.update(<GrammarCategoryScreen />);
    });
    const upcoming = root.root.findByProps({ testID: 'grammar-topic-present-continuous' });
    expect(upcoming.props.disabled).not.toBe(true);
    await act(() => {
      upcoming.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarTopic', { topicId: 'topic-2' });

    hooks.useGrammarTopics.mockReturnValue({
      isLoading: false,
      isError: false,
      isSuccess: true,
      data: [
        {
          id: 'other',
          slug: 'standups',
          title: 'Standups',
          description: 'Meetings',
          sortOrder: 1,
          lessonCount: 3,
          categorySlug: 'workplace-english',
          curriculumVersion: 2,
          isOptional: false,
        },
      ],
      refetch: refetchTopics,
    });
    await act(() => {
      root.update(<GrammarCategoryScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('No topics in this path')),
    ).toBe(true);
  });

  it('hides category Continue when every topic is completed', async () => {
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
          lessonCount: 3,
          categorySlug: 'core-tenses',
          curriculumVersion: 2,
          isOptional: false,
        },
        {
          id: 'topic-2',
          slug: 'present-continuous',
          title: 'Present Continuous',
          description: 'Now',
          sortOrder: 2,
          lessonCount: 3,
          categorySlug: 'core-tenses',
          curriculumVersion: 2,
          isOptional: false,
        },
      ],
      refetch: jest.fn(async () => undefined),
    });
    hooks.useGrammarProgress.mockReturnValue({
      data: [
        { lessonId: 'l1', topicId: 'topic-1', status: 'completed' },
        { lessonId: 'l2', topicId: 'topic-1', status: 'completed' },
        { lessonId: 'l3', topicId: 'topic-1', status: 'completed' },
        { lessonId: 'l4', topicId: 'topic-2', status: 'completed' },
        { lessonId: 'l5', topicId: 'topic-2', status: 'completed' },
        { lessonId: 'l6', topicId: 'topic-2', status: 'completed' },
      ],
      refetch: jest.fn(async () => undefined),
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarCategoryScreen />);
    });

    expect(root.root.findAllByProps({ testID: 'grammar-category-continue' })).toHaveLength(0);
    const completedRow = root.root.findByProps({ testID: 'grammar-topic-present-simple' });
    expect(completedRow.props.accessibilityState?.disabled).not.toBe(true);
    await act(() => {
      completedRow.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('GrammarTopic', { topicId: 'topic-1' });
  });
});
