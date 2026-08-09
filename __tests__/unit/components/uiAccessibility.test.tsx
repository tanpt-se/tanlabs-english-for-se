import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { AppFormError } from '@/components/ui/AppControls';
import { darkColors, lightColors } from '@/theme';

function luminance(hex: string) {
  const channels = hex
    .match(/[0-9a-f]{2}/gi)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: string, second: string) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);

  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

test.each([
  ['light primary surface', lightColors.primary, lightColors.onPrimary],
  ['light primary text', lightColors.primary, lightColors.background],
  ['light danger surface', lightColors.danger, lightColors.onDanger],
  ['dark primary surface', darkColors.primary, darkColors.onPrimary],
  ['dark danger surface', darkColors.danger, darkColors.onDanger],
])('%s meets normal-text contrast', (_name, foreground, background) => {
  expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
});

test('form error exposes an assertive alert relationship target', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<AppFormError nativeID="form-error" message="Try again" />);
  });

  const error = renderer!.root.findByType(Text);
  expect(error.props.nativeID).toBe('form-error');
  expect(error.props.accessibilityLiveRegion).toBe('assertive');
  expect(error.props.accessibilityRole).toBe('alert');
});
