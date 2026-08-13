import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { SegmentedControl } from '@/components/ui/selection/SegmentedControl';

describe('SegmentedControl', () => {
  it('renders equal segments and reports selection', async () => {
    const onChange = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <SegmentedControl
          testID="seg"
          value="all"
          onChange={onChange}
          options={[
            { key: 'all', label: 'All (5)' },
            { key: 'learning', label: 'Learning (3)' },
            { key: 'known', label: 'Known (2)' },
          ]}
        />,
      );
    });

    expect(root.root.findByProps({ testID: 'seg-all' })).toBeTruthy();
    await act(() => {
      root.root.findByProps({ testID: 'seg-learning' }).props.onPress();
    });
    expect(onChange).toHaveBeenCalledWith('learning');
  });
});
