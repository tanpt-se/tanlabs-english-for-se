import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { ChooseExpressionExerciseView } from '@/features/vocabulary/components/ChooseExpressionExerciseView';
import { FillBlankExerciseView } from '@/features/vocabulary/components/FillBlankExerciseView';
import { LevelSectionHeader } from '@/features/vocabulary/components/LevelSectionHeader';
import { PosBadge } from '@/features/vocabulary/components/PosBadge';
import { PracticeFeedback } from '@/features/vocabulary/components/PracticeFeedback';
import { PracticeProgressBar } from '@/features/vocabulary/components/PracticeProgressBar';
import { SentenceOrderExerciseView } from '@/features/vocabulary/components/SentenceOrderExerciseView';
import { TermRow } from '@/features/vocabulary/components/TermRow';

import {
  FIXTURE_CHOOSE,
  FIXTURE_FILL,
  FIXTURE_ORDER,
} from '../../../../helpers/vocabularyFixtures';

describe('vocabulary exercise views + chrome', () => {
  it('renders choose/fill/order interactions', async () => {
    const onSelect = jest.fn();
    const onChangeFill = jest.fn();
    const onChangeOrder = jest.fn();

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <ChooseExpressionExerciseView
          exercise={FIXTURE_CHOOSE}
          selectedOptionId="opt_a"
          checked={false}
          onSelect={onSelect}
        />,
      );
    });
    expect(root.root.findByProps({ testID: 'vocabulary-exercise-choose' })).toBeTruthy();

    await act(() => {
      root.update(
        <ChooseExpressionExerciseView
          exercise={FIXTURE_CHOOSE}
          selectedOptionId="opt_b"
          checked
          onSelect={onSelect}
        />,
      );
    });

    await act(() => {
      root.update(
        <FillBlankExerciseView
          exercise={FIXTURE_FILL}
          value="blocker"
          checked={false}
          onChange={onChangeFill}
        />,
      );
    });
    expect(root.root.findByProps({ testID: 'vocabulary-exercise-fill' })).toBeTruthy();

    await act(() => {
      root.update(
        <SentenceOrderExerciseView
          exercise={FIXTURE_ORDER}
          orderedTokenIds={[]}
          checked={false}
          onChange={onChangeOrder}
        />,
      );
    });
    expect(root.root.findByProps({ testID: 'vocabulary-exercise-order' })).toBeTruthy();
    await act(() => {
      root.root.findByProps({ accessibilityLabel: 'Add I' }).props.onPress();
    });
    expect(onChangeOrder).toHaveBeenCalledWith(['t1']);

    await act(() => {
      root.update(
        <SentenceOrderExerciseView
          exercise={FIXTURE_ORDER}
          orderedTokenIds={['t1']}
          checked={false}
          onChange={onChangeOrder}
        />,
      );
    });
    await act(() => {
      root.root.findByProps({ accessibilityLabel: 'Remove I' }).props.onPress();
    });
    expect(onChangeOrder).toHaveBeenCalledWith([]);
  });

  it('renders feedback, progress, badges, headers, and term rows', async () => {
    const onBack = jest.fn();
    const onSkip = jest.fn();
    const onPress = jest.fn();

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <>
          <PracticeFeedback
            correct
            explanation="Because"
            correctAnswerLabel="blocker"
            expression="blocker"
            meaning="m"
            context="c"
            example="e"
          />
          <PracticeProgressBar
            canGoBack
            canSkip
            index={0}
            total={10}
            onBack={onBack}
            onSkip={onSkip}
          />
          <LevelSectionHeader collapsed={false} count={3} level="A2" onToggle={jest.fn()} />
          <PosBadge pos="n" />
          <TermRow
            known={false}
            level="A2"
            onPressRow={onPress}
            onToggleKnown={jest.fn()}
            pos="expr"
            term="blocker"
          />
        </>,
      );
    });

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-practice-back' }).props.onPress();
      root.root.findByProps({ testID: 'vocabulary-practice-skip' }).props.onPress();
    });
    expect(onBack).toHaveBeenCalled();
    expect(onSkip).toHaveBeenCalled();

    await act(() => {
      root.root.findByProps({ accessibilityLabel: 'blocker, expr, A2. Learning' }).props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });
});
