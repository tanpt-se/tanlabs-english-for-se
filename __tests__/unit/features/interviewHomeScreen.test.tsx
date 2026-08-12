import React from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { InterviewHomeScreen } from '@/features/interview/screens/InterviewHomeScreen';

const insetMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

describe('InterviewHomeScreen', () => {
  it('renders the coming-soon placeholder', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={insetMetrics}>
          <InterviewHomeScreen />
        </SafeAreaProvider>,
      );
    });
    expect(root.root.findByProps({ testID: 'interview-home' })).toBeTruthy();
    expect(
      root.root.findAllByType(Text).some((node) => node.props.children === 'Coming soon'),
    ).toBe(true);
  });
});
