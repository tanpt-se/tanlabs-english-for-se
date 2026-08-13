import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { LevelSectionHeader } from '@/features/vocabulary/components/LevelSectionHeader';

describe('LevelSectionHeader', () => {
  it('renders CEFR band chrome and toggles', () => {
    const onToggle = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      root = ReactTestRenderer.create(
        <LevelSectionHeader collapsed={false} count={12} level="C1" onToggle={onToggle} />,
      );
    });

    const labels = root.root.findAllByType(Text).map((node) => String(node.props.children));
    expect(labels).toEqual(expect.arrayContaining(['C1', 'Advanced', '12']));

    act(() => {
      root.root.findByProps({ testID: 'level-section-C1' }).props.onPress();
    });
    expect(onToggle).toHaveBeenCalled();
  });
});
