import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  GrammarTopicCard,
  PracticeFeedback,
  SentenceOrderExerciseView,
} from '@/features/grammar/components';

import { FIXTURE_ORDER } from '../../../../helpers/grammarFixtures';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('grammar UI components', () => {
  it('renders topic card status labels', async () => {
    const topic = {
      id: 't1',
      slug: 'present-simple' as const,
      title: 'Present Simple',
      description: 'Habits',
      sortOrder: 1,
      lessonCount: 3,
      categorySlug: 'core-tenses',
      curriculumVersion: 2,
      isOptional: false,
    };

    const cases: Array<{
      status: 'not_started' | 'in_progress' | 'completed';
      label: string;
      progress: number;
    }> = [
      { status: 'not_started', label: 'NOT STARTED', progress: 0 },
      { status: 'in_progress', label: 'IN PROGRESS', progress: 0.6 },
      { status: 'completed', label: 'COMPLETED', progress: 1 },
    ];

    for (const item of cases) {
      let root!: ReactTestRenderer.ReactTestRenderer;
      await act(() => {
        root = ReactTestRenderer.create(
          <GrammarTopicCard
            topic={topic}
            status={item.status}
            subtitle="Ready to begin"
            progress={item.progress}
            onPress={() => undefined}
          />,
        );
      });
      expect(root.root.findAllByType(Text).some((node) => node.props.children === item.label)).toBe(
        true,
      );
      const pressable = root.root.findByProps({ testID: `grammar-topic-${topic.slug}` });
      expect(pressable.props.onPress).toEqual(expect.any(Function));
      expect(pressable.props.accessibilityState?.disabled).not.toBe(true);
      act(() => {
        root.unmount();
      });
    }
  });

  it('renders no progress fill when not started even if progress prop is non-zero', async () => {
    const topic = {
      id: 't1',
      slug: 'present-simple' as const,
      title: 'Present Simple',
      description: 'Habits',
      sortOrder: 1,
      lessonCount: 3,
      categorySlug: 'core-tenses',
      curriculumVersion: 2,
      isOptional: false,
    };

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <GrammarTopicCard
          topic={topic}
          status="not_started"
          subtitle="0% · Ready to begin"
          progress={0.12}
          onPress={() => undefined}
        />,
      );
    });

    const track = root.root.findByProps({ accessibilityLabel: '0 percent complete' });
    expect(track.props.children).toBeTruthy();
  });

  it('shows Correct and Incorrect practice feedback', async () => {
    let ok!: ReactTestRenderer.ReactTestRenderer;
    let bad!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      ok = ReactTestRenderer.create(
        <PracticeFeedback correct explanation="Because" correctAnswerLabel="works" />,
      );
      bad = ReactTestRenderer.create(
        <PracticeFeedback correct={false} explanation="Because" correctAnswerLabel="works" />,
      );
    });
    expect(
      ok.root.findAllByType(Text).some((node) => String(node.props.children).includes('Correct')),
    ).toBe(true);
    expect(
      bad.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Incorrect')),
    ).toBe(true);
  });

  it('adds and removes sentence-order tokens', async () => {
    const exercise = FIXTURE_ORDER;
    const onChange = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <SentenceOrderExerciseView
          exercise={exercise}
          orderedTokenIds={[]}
          checked={false}
          onChange={onChange}
        />,
      );
    });

    const first = exercise.payload.tokens[0];
    const add = root.root.findByProps({ accessibilityLabel: `Add ${first.text}` });
    await act(() => {
      add.props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith([first.id]);

    await act(() => {
      root.update(
        <SentenceOrderExerciseView
          exercise={exercise}
          orderedTokenIds={[first.id]}
          checked={false}
          onChange={onChange}
        />,
      );
    });
    const remove = root.root.findByProps({ accessibilityLabel: `Remove ${first.text}` });
    await act(() => {
      remove.props.onPress();
    });
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
