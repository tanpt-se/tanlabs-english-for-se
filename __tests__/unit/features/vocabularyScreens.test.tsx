import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { PracticeResultScreen } from '@/features/vocabulary/screens/PracticeResultScreen';
import { PracticeScreen } from '@/features/vocabulary/screens/PracticeScreen';
import { SituationDetailScreen } from '@/features/vocabulary/screens/SituationDetailScreen';
import { VocabularyHomeScreen } from '@/features/vocabulary/screens/VocabularyHomeScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();

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
      replace: mockReplace,
    }),
    useRoute: () => ({
      params: { situationId: 'task-progress', correct: 7, total: 10 },
    }),
  };
});

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: () => ({ data: { vocabulary: true } }),
}));

describe('vocabulary screen skeleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists situations and opens a situation', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<VocabularyHomeScreen />);
    });
    expect(root.root.findAllByType(Text).some((node) => node.props.children === 'Situations')).toBe(
      true,
    );

    await act(() => {
      root.root.findByProps({ accessibilityLabel: 'Task & Progress, 3 / 10' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularySituation', {
      situationId: 'task-progress',
    });
  });

  it('shows expressions and starts practice', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<SituationDetailScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => node.props.children === 'I’m blocked by the API dependency.'),
    ).toBe(true);

    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Practice 2 questions')),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'practice-cta' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyPractice', {
      situationId: 'task-progress',
    });
  });

  it('checks an answer then advances to next question', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<PracticeScreen />);
    });

    await act(() => {
      root.root
        .findByProps({ accessibilityLabel: 'I’m blocked by the API dependency.' })
        .props.onPress();
    });
    await act(() => {
      root.root.findByProps({ testID: 'practice-action' }).props.onPress();
    });
    expect(
      root.root.findAllByType(Text).some((node) => node.props.children === 'Clear and actionable'),
    ).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'practice-action' }).props.onPress();
    });
    expect(mockReplace).not.toHaveBeenCalled();
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).replace(/,/g, '') === '2 of 2'),
    ).toBe(true);
  });

  it('renders result summary metrics', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<PracticeResultScreen />);
    });
    const labels = root.root.findAllByType(Text).map((node) => String(node.props.children));
    expect(labels).toEqual(
      expect.arrayContaining(['Practice complete', 'Session complete', '7', '3', '70%']),
    );

    await act(() => {
      root.root.findByProps({ testID: 'result-cta' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyHome');
  });
});
