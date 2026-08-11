import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { GrammarHomeScreen } from '@/features/grammar/screens/GrammarHomeScreen';
import { GrammarLessonScreen } from '@/features/grammar/screens/GrammarLessonScreen';
import { GrammarPracticeScreen } from '@/features/grammar/screens/GrammarPracticeScreen';
import { GrammarResultScreen } from '@/features/grammar/screens/GrammarResultScreen';
import { GrammarTopicScreen } from '@/features/grammar/screens/GrammarTopicScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const routeParams = {
  topicId: 'present-simple',
  lessonId: 'present-simple-core',
  clientAttemptId: '11111111-1111-4111-8111-111111111111',
};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
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
      params: routeParams,
    }),
  };
});

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(() => ({ data: { grammar: true, vocabulary: false } })),
}));

const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
  useFeatureFlags: jest.Mock;
};

describe('grammar screen shell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFeatureFlags.mockReturnValue({ data: { grammar: true, vocabulary: false } });
  });

  it('renders Grammar Home when the flag is on', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarHomeScreen />);
    });
    expect(root.root.findAllByType(Text).some((node) => node.props.children === 'Grammar')).toBe(
      true,
    );
  });

  it('redirects home when grammar flag is off', async () => {
    useFeatureFlags.mockReturnValue({ data: { grammar: false } });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarHomeScreen />);
    });
    expect(root.toJSON()).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('renders nested placeholders with stable params', async () => {
    let topic!: ReactTestRenderer.ReactTestRenderer;
    let lesson!: ReactTestRenderer.ReactTestRenderer;
    let practice!: ReactTestRenderer.ReactTestRenderer;
    let result!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      topic = ReactTestRenderer.create(<GrammarTopicScreen />);
      lesson = ReactTestRenderer.create(<GrammarLessonScreen />);
      practice = ReactTestRenderer.create(<GrammarPracticeScreen />);
      result = ReactTestRenderer.create(<GrammarResultScreen />);
    });
    expect(topic.root.findByProps({ testID: 'grammar-topic' })).toBeTruthy();
    expect(lesson.root.findByProps({ testID: 'grammar-lesson' })).toBeTruthy();
    expect(practice.root.findByProps({ testID: 'grammar-practice' })).toBeTruthy();
    expect(result.root.findByProps({ testID: 'grammar-result' })).toBeTruthy();

    await act(() => {
      topic.root.findByProps({ accessibilityLabel: 'Go back' }).props.onPress();
      lesson.root.findByProps({ accessibilityLabel: 'Go back' }).props.onPress();
      practice.root.findByProps({ accessibilityLabel: 'Go back' }).props.onPress();
      result.root.findByProps({ accessibilityLabel: 'Go back' }).props.onPress();
    });
    expect(mockGoBack).toHaveBeenCalledTimes(3);
    expect(mockNavigate).toHaveBeenCalledWith('GrammarHome');
  });
});
