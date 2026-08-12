import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { PracticeProgressBar } from '@/features/grammar/components/PracticeProgressBar';

describe('PracticeProgressBar', () => {
  it('renders progress and handles back/skip callbacks', async () => {
    const onBack = jest.fn();
    const onSkip = jest.fn();

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <PracticeProgressBar
          index={1}
          total={5}
          canGoBack
          canSkip
          onBack={onBack}
          onSkip={onSkip}
        />,
      );
    });

    expect(
      root.root.findByProps({ testID: 'grammar-practice-progress' }).props.accessibilityLabel,
    ).toBe('Question 2 of 5');

    await act(() => {
      root.root.findByProps({ testID: 'grammar-practice-back' }).props.onPress();
      root.root.findByProps({ testID: 'grammar-practice-skip' }).props.onPress();
    });
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('clamps index/total and ignores presses when disabled', async () => {
    const onBack = jest.fn();
    const onSkip = jest.fn();

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <PracticeProgressBar
          index={-5}
          total={0}
          canGoBack={false}
          canSkip={false}
          onBack={onBack}
          onSkip={onSkip}
        />,
      );
    });

    expect(
      root.root.findByProps({ testID: 'grammar-practice-progress' }).props.accessibilityLabel,
    ).toBe('Question 0 of 1');

    await act(() => {
      root.root.findByProps({ testID: 'grammar-practice-back' }).props.onPress();
      root.root.findByProps({ testID: 'grammar-practice-skip' }).props.onPress();
    });
    expect(onBack).not.toHaveBeenCalled();
    expect(onSkip).not.toHaveBeenCalled();

    await act(() => {
      root.update(
        <PracticeProgressBar
          index={99}
          total={3}
          canGoBack
          canSkip
          onBack={onBack}
          onSkip={onSkip}
        />,
      );
    });
    expect(
      root.root.findByProps({ testID: 'grammar-practice-progress' }).props.accessibilityLabel,
    ).toBe('Question 3 of 3');
  });
});
