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
const routeParams = {
  situationId: 'task-progress',
  correct: 7,
  total: 10,
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
      replace: mockReplace,
    }),
    useRoute: () => ({
      params: routeParams,
    }),
  };
});

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(() => ({ data: { vocabulary: true } })),
}));

const { useFeatureFlags } = jest.requireMock('@/core/remote-config/useFeatureFlags') as {
  useFeatureFlags: jest.Mock;
};

describe('vocabulary screen skeleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFeatureFlags.mockReturnValue({ data: { vocabulary: true } });
    routeParams.situationId = 'task-progress';
    routeParams.correct = 7;
    routeParams.total = 10;
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

  it('redirects home when vocabulary flag is off', async () => {
    useFeatureFlags.mockReturnValue({ data: { vocabulary: false } });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<VocabularyHomeScreen />);
    });
    expect(root.toJSON()).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('Home');
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

  it('marks incorrect answers and finishes practice on the last question', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<PracticeScreen />);
    });

    await act(() => {
      root.root.findByProps({ accessibilityLabel: 'The task is on track.' }).props.onPress();
    });
    await act(() => {
      root.root.findByProps({ testID: 'practice-action' }).props.onPress();
    });
    expect(root.root.findAllByType(Text).some((node) => node.props.children === '✕')).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'practice-action' }).props.onPress();
    });
    await act(() => {
      root.root
        .findByProps({ accessibilityLabel: 'I’ve completed the implementation.' })
        .props.onPress();
    });
    await act(() => {
      root.root.findByProps({ testID: 'practice-action' }).props.onPress();
    });
    await act(() => {
      root.root.findByProps({ testID: 'practice-action' }).props.onPress();
    });
    expect(mockReplace).toHaveBeenCalledWith('VocabularyResult', {
      situationId: 'task-progress',
      correct: 1,
      total: 2,
    });
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
      root.root.findByProps({ accessibilityLabel: 'Go back' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('VocabularyHome');
  });

  it('falls back when situation id is unknown', async () => {
    routeParams.situationId = 'missing';
    routeParams.correct = 1;
    routeParams.total = 1;

    let detail!: ReactTestRenderer.ReactTestRenderer;
    let result!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      detail = ReactTestRenderer.create(<SituationDetailScreen />);
      result = ReactTestRenderer.create(<PracticeResultScreen />);
    });
    expect(
      detail.root.findAllByType(Text).some((node) => node.props.children === 'Situation'),
    ).toBe(true);
    expect(
      result.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Great work')),
    ).toBe(true);
  });
});
