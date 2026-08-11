import React from 'react';
import { Image, Text, TextInput, useColorScheme } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { AppButton } from '@/components/ui/button';
import { AppTextInput, FieldTextInput } from '@/components/ui/input';
import { ScreenScroll } from '@/components/ui/layout';
import { BottomActionBar, BottomNavigation, TopAppHeader } from '@/components/ui/navigation';
import { AnswerOption } from '@/components/ui/selection';
import { AuthHeader } from '@/features/auth/components';
import { HomeFeatureRow } from '@/features/home/components';
import { EnglishLevelPicker, ProfileSection } from '@/features/profile/components';
import { SettingRow } from '@/features/settings/components';
import {
  CompletionHero,
  ExpressionCard,
  Feedback,
  InsightPanel,
  ProgressBanner,
  PromptCard,
  ResultMetric,
  SituationCard,
} from '@/features/vocabulary/components';
import { lightColors, themeTokens } from '@/theme';

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
        (entry: { backgroundColor?: string; opacity?: number } | false | undefined) =>
          entry &&
          (entry.opacity === 0.5 || entry.backgroundColor === lightColors.surfaceSecondary),
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

  it('renders AuthHeader with optional subtitle and logo', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<AuthHeader title="Welcome back" />);
    });
    expect(root.root.findAllByType(Text)).toHaveLength(1);
    expect(root.root.findAllByType(Image)).toHaveLength(0);

    await act(() => {
      root.update(<AuthHeader showLogo title="Welcome" subtitle="Get started" />);
    });
    const texts = root.root.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toEqual(['Welcome', 'Get started']);
    expect(root.root.findByType(Image).props.accessibilityLabel).toBe('TanLabs logo');
  });

  it('renders SettingRow value and press handling', async () => {
    const onPress = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <SettingRow label="Version" value="1.0.0" onPress={onPress} />,
      );
    });

    const row = root.root.findByProps({ accessibilityLabel: 'Version' });
    await act(() => {
      row.props.onPress();
    });
    expect(onPress).toHaveBeenCalled();

    await act(() => {
      root.update(<SettingRow label="Version" />);
    });
    expect(root.root.findAllByType(Text)).toHaveLength(1);

    const onValueChange = jest.fn();
    await act(() => {
      root.update(
        <SettingRow
          label="Enable notifications"
          switchValue={false}
          value="Synced with your account"
          onValueChange={onValueChange}
        />,
      );
    });
    const toggle = root.root.find(
      (node) =>
        node.props.accessibilityRole === 'switch' && typeof node.props.onPress === 'function',
    );
    await act(() => {
      toggle.props.onPress();
    });
    expect(onValueChange).toHaveBeenCalledWith(true);
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

    const selected = root.root.findByProps({
      accessibilityLabel: 'English level B1 · Intermediate',
    });
    expect(selected.props.accessibilityRole).toBe('radio');
    expect(selected.props.accessibilityState?.selected ?? selected.props.selected).toBeTruthy();
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('B1 · Intermediate')),
    ).toBe(true);

    const next = root.root.findByProps({
      accessibilityLabel: 'English level B2 · Upper intermediate',
    });
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

  it('applies Figma large AppButton padding', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <AppButton label="Practice" size="large" accessibilityLabel="Practice" />,
      );
    });
    const button = root.root.find(
      (node) =>
        node.props.accessibilityLabel === 'Practice' && typeof node.props.style === 'function',
    );
    const style = button.props.style({ pressed: false });
    expect(
      style.some(
        (entry: { paddingHorizontal?: number } | false | undefined) =>
          entry && entry.paddingHorizontal === themeTokens.spacing.lg,
      ),
    ).toBe(true);
  });

  it('renders TopAppHeader with optional back action', async () => {
    const onBackPress = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<TopAppHeader title="Vocabulary" />);
    });
    expect(root.root.findByType(Text).props.children).toBe('Vocabulary');

    await act(() => {
      root.update(<TopAppHeader showBack title="Task" onBackPress={onBackPress} />);
    });
    const back = root.root.findByProps({ accessibilityLabel: 'Go back' });
    await act(() => {
      back.props.onPress();
    });
    expect(onBackPress).toHaveBeenCalled();
  });

  it('renders BottomNavigation active destination', async () => {
    const onSelect = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<BottomNavigation active="vocabulary" onSelect={onSelect} />);
    });
    const vocabulary = root.root.findByProps({ accessibilityLabel: 'Vocabulary' });
    expect(vocabulary.props.accessibilityState?.selected).toBe(true);
    await act(() => {
      root.root.findByProps({ accessibilityLabel: 'Home' }).props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('home');
  });

  it('disables unavailable bottom destinations', async () => {
    const onSelect = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <BottomNavigation active="home" disabledDestinations={['grammar']} onSelect={onSelect} />,
      );
    });
    const grammar = root.root.findByProps({ accessibilityLabel: 'Grammar' });
    expect(grammar.props.disabled).toBe(true);
    expect(grammar.props.accessibilityState).toEqual({ disabled: true, selected: false });
  });

  it('renders long Home feature copy and disabled state safely', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <HomeFeatureRow
          icon="interview"
          statusLabel="Coming soon"
          subtitle="Practice structured answers for complex software engineering interviews"
          title="Interview practice for senior software engineers"
          tone="comingSoon"
        />,
      );
    });
    const row = root.root.findByProps({
      accessibilityLabel: 'Interview practice for senior software engineers',
    });
    expect(row.props.accessibilityState).toEqual({ disabled: true });
    const textNodes = root.root.findAllByType(Text);
    expect(
      textNodes.find(
        (node) => node.props.children === 'Interview practice for senior software engineers',
      )?.props.numberOfLines,
    ).toBe(2);
  });

  it('renders AnswerOption states', async () => {
    const onPress = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <AnswerOption label="I’m blocked by the API." onPress={onPress} state="selected" />,
      );
    });
    const option = root.root.findByProps({
      accessibilityLabel: 'I’m blocked by the API.',
    });
    expect(option.props.accessibilityState?.selected).toBe(true);
    await act(() => {
      option.props.onPress();
    });
    expect(onPress).toHaveBeenCalled();

    await act(() => {
      root.update(<AnswerOption label="Done" state="correct" />);
    });
    expect(root.root.findAllByType(Text).some((node) => node.props.children === '✓')).toBe(true);
  });

  it('renders BottomActionBar primary CTA', async () => {
    const onPress = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <BottomActionBar label="Check answer" onPress={onPress} testID="cta" />,
      );
    });
    const cta = root.root.findByProps({ testID: 'cta' });
    await act(() => {
      cta.props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });

  it('toggles FieldTextInput password visibility with eye icons', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <FieldTextInput
          testID="password"
          label="Password"
          mode="password"
          value="secret"
          onChangeText={() => undefined}
        />,
      );
    });

    const input = root.root.find(
      (node) =>
        node.props.accessibilityLabel === 'Password' &&
        typeof node.props.onChangeText === 'function',
    );
    expect(input.props.secureTextEntry).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'password-visibility' }).props.onPress();
    });
    expect(
      root.root.find(
        (node) =>
          node.props.accessibilityLabel === 'Password' &&
          typeof node.props.onChangeText === 'function',
      ).props.secureTextEntry,
    ).toBe(false);
    expect(root.root.findByProps({ accessibilityLabel: 'Hide password' })).toBeTruthy();
  });

  it('keeps Figma semantic color aliases on light palette', () => {
    expect(lightColors.borderSubtle).toBe('#EEEFF1');
    expect(lightColors.success).toBe('#4CAF82');
    expect(lightColors.dangerSoft).toBe('#FDECEC');
    expect(lightColors.warning).toBe('#E8A838');
    expect(themeTokens.radius.xl).toBe(20);
    expect(themeTokens.radius.card).toBe(14);
    expect(themeTokens.spacing['12']).toBe(12);
  });

  it('renders PH3 learning primitives', async () => {
    const onSituation = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <>
          <ProgressBanner title="Progress across 5 workplace situations" subtitle="Offline" />
          <SituationCard
            title="Task & Progress"
            description="Status, ownership, next steps"
            progress="3 / 10"
            selected
            onPress={onSituation}
          />
          <ExpressionCard title="I’m blocked by the API dependency." tag="BLOCKER" />
          <PromptCard text="The API dependency is preventing you from continuing." />
          <InsightPanel title="Clear and actionable" body="Names the blocker." />
          <ResultMetric type="correct" value="7" />
          <ResultMetric type="needsPractice" value="3" />
          <ResultMetric type="score" value="70%" />
          <Feedback type="success" title="Progress saved" message="Queued for retry." />
          <CompletionHero
            situation="TASK & PROGRESS"
            title="Practice complete"
            message="You got 7 of 10 correct."
          />
          <FieldTextInput label="Your answer" value="blocker" helper="" />
        </>,
      );
    });

    await act(() => {
      root.root.findByProps({ accessibilityLabel: 'Task & Progress, 3 / 10' }).props.onPress();
    });
    expect(onSituation).toHaveBeenCalled();
    expect(
      root.root.findAllByType(Text).some((node) => node.props.children === 'Practice complete'),
    ).toBe(true);
    expect(
      root.root.findAllByType(Text).some((node) => node.props.children === 'Your answer'),
    ).toBe(true);
  });
});
