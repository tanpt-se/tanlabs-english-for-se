import React from 'react';
import { Text, TextInput, useColorScheme } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppButton, AppTextInput } from '@/components/ui/AppControls';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { ProfileSection } from '@/components/ui/ProfileSection';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SettingRow } from '@/components/ui/SettingRow';
import { EnglishLevelPicker } from '@/features/profile/components/EnglishLevelPicker';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
}));

describe('shared UI components', () => {
  afterEach(() => {
    jest.mocked(useColorScheme).mockReturnValue('light');
  });

  it('renders AppButton variants and pressed/disabled styles', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <AppButton label="Save" tone="danger" variant="outline" accessibilityLabel="Save" />,
      );
    });

    const button = root.root.find(
      (node) => node.props.accessibilityLabel === 'Save' && typeof node.props.style === 'function',
    );
    expect(root.root.findByType(Text).props.children).toBe('Save');

    const style = button.props.style({ pressed: true });
    expect(
      style.some(
        (entry: { opacity?: number } | false | undefined) => entry && entry.opacity === 0.75,
      ),
    ).toBe(true);

    await act(() => {
      root.update(
        <AppButton label="Save" disabled accessibilityLabel="Save" style={{ marginTop: 8 }} />,
      );
    });
    const disabledButton = root.root.find(
      (node) => node.props.accessibilityLabel === 'Save' && typeof node.props.style === 'function',
    );
    const disabledStyle = disabledButton.props.style({ pressed: false });
    expect(
      disabledStyle.some(
        (entry: { opacity?: number } | false | undefined) => entry && entry.opacity === 0.5,
      ),
    ).toBe(true);
  });

  it('renders AppTextInput with theme placeholder color', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <AppTextInput accessibilityLabel="Email" placeholder="you@example.com" value="" />,
      );
    });
    const input = root.root.findByType(TextInput);
    expect(input.props.placeholderTextColor).toBeTruthy();
    expect(input.props.accessibilityLabel).toBe('Email');
  });

  it('renders AuthHeader with optional subtitle', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<AuthHeader title="Sign in" />);
    });
    expect(root.root.findAllByType(Text)).toHaveLength(1);

    await act(() => {
      root.update(<AuthHeader title="Sign in" subtitle="Welcome back" />);
    });
    const texts = root.root.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(['Sign in', 'Welcome back']);
  });

  it('renders SettingRow value and press handling', async () => {
    const onPress = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <SettingRow label="Version" value="1.0.0" onPress={onPress} />,
      );
    });

    const row = root.root.findByProps({ disabled: false });
    await act(() => {
      row.props.onPress();
    });
    expect(onPress).toHaveBeenCalled();

    await act(() => {
      root.update(<SettingRow label="Version" />);
    });
    expect(root.root.findByProps({ disabled: true })).toBeTruthy();
    expect(root.root.findAllByType(Text)).toHaveLength(1);
  });

  it('renders ProfileSection description and children', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <ProfileSection title="Profile" description="Basics">
          <Text>Child</Text>
        </ProfileSection>,
      );
    });
    const texts = root.root.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(['Profile', 'Basics', 'Child']);
  });

  it('renders ScreenScroll centered and default layouts', async () => {
    Object.defineProperty(require('react-native').Platform, 'OS', {
      configurable: true,
      get: () => 'android',
    });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <ScreenScroll centered>
          <Text>Auth</Text>
        </ScreenScroll>,
      );
    });
    expect(root.root.findByType(Text).props.children).toBe('Auth');

    Object.defineProperty(require('react-native').Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });
    await act(() => {
      root.update(
        <ScreenScroll>
          <Text>Home</Text>
        </ScreenScroll>,
      );
    });
    expect(root.root.findByType(Text).props.children).toBe('Home');
  });

  it('selects English levels with accessibility selected state', async () => {
    const onChange = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<EnglishLevelPicker value="B1" onChange={onChange} />);
    });

    const selected = root.root.findByProps({ accessibilityLabel: 'English level B1' });
    expect(selected.props.accessibilityRole).toBe('button');
    expect(selected.props.accessibilityState?.selected ?? selected.props.selected).toBeTruthy();

    const next = root.root.findByProps({ accessibilityLabel: 'English level B2' });
    await act(() => {
      next.props.onPress();
      if (typeof next.props.style === 'function') {
        next.props.style({ pressed: true });
      }
    });
    expect(onChange).toHaveBeenCalledWith('B2');
  });

  it('renders AppButton in dark mode colors', async () => {
    jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('dark');
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<AppButton label="Dark" accessibilityLabel="Dark" />);
    });
    expect(root.root.findByType(Text).props.children).toBe('Dark');
  });
});
