import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { MainTabNavigator } from '@/app/navigation/MainTabNavigator';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';

const mockNavigate = jest.fn();
const mockGetFocusedRouteNameFromRoute = jest.fn((_route?: unknown) => {
  return undefined as string | undefined;
});

let mockTabBarProps: {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: { navigate: typeof mockNavigate };
};

jest.mock('@/core/remote-config/useFeatureFlags', () => ({
  useFeatureFlags: jest.fn(),
}));

jest.mock('@/components/ui/navigation', () => ({
  BottomNavigation: ({
    active,
    disabledDestinations = [],
    onSelect,
  }: {
    active: string;
    disabledDestinations?: string[];
    onSelect?: (destination: string) => void;
  }) => {
    const ReactLocal = require('react');
    const { Text: TextLocal, Pressable } = require('react-native');
    return ReactLocal.createElement(
      ReactLocal.Fragment,
      null,
      ReactLocal.createElement(TextLocal, { testID: 'app-tab-bar' }, active),
      ReactLocal.createElement(TextLocal, null, disabledDestinations.join(',')),
      ['home', 'grammar', 'vocabulary', 'interview', 'profile'].map((destination) =>
        ReactLocal.createElement(
          Pressable,
          {
            key: destination,
            testID: `tab-select-${destination}`,
            onPress: () => onSelect?.(destination),
          },
          destination,
        ),
      ),
    );
  },
}));

jest.mock('@/features/home/screens/HomeScreen', () => ({
  HomeScreen: () => null,
}));
jest.mock('@/features/settings/screens/SettingsScreen', () => ({
  SettingsScreen: () => null,
}));
jest.mock('@/features/grammar/navigation/GrammarNavigator', () => ({
  GrammarNavigator: () => null,
}));
jest.mock('@/features/vocabulary/navigation/VocabularyNavigator', () => ({
  VocabularyNavigator: () => null,
}));
jest.mock('@/features/interview/screens/InterviewHomeScreen', () => ({
  InterviewHomeScreen: () => null,
}));

jest.mock('@react-navigation/bottom-tabs', () => {
  const ReactLocal = require('react');
  const { Text: TextLocal } = require('react-native');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({
        children,
        tabBar,
      }: {
        children: React.ReactNode;
        tabBar?: (props: typeof mockTabBarProps) => React.ReactNode;
      }) =>
        ReactLocal.createElement(
          ReactLocal.Fragment,
          null,
          children,
          tabBar ? tabBar(mockTabBarProps) : null,
        ),
      Screen: ({ name }: { name: string }) => ReactLocal.createElement(TextLocal, null, name),
    }),
  };
});

jest.mock('@react-navigation/native', () => ({
  getFocusedRouteNameFromRoute: (route: unknown) => mockGetFocusedRouteNameFromRoute(route),
}));

describe('MainTabNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFocusedRouteNameFromRoute.mockReturnValue(undefined);
    mockTabBarProps = {
      state: {
        index: 0,
        routes: [
          { key: 'Home', name: 'Home' },
          { key: 'Grammar', name: 'Grammar' },
          { key: 'Vocabulary', name: 'Vocabulary' },
          { key: 'Interview', name: 'Interview' },
          { key: 'Profile', name: 'Profile' },
        ],
      },
      navigation: { navigate: mockNavigate },
    };
    jest.mocked(useFeatureFlags).mockReturnValue({
      data: { grammar: true, vocabulary: true, interview: false, ai: false },
    } as never);
  });

  it('registers all main tabs and renders the shared tab bar', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<MainTabNavigator />);
    });
    const labels = root.root.findAllByType(Text).map((node) => node.props.children);
    expect(labels).toEqual(
      expect.arrayContaining(['Home', 'Grammar', 'Vocabulary', 'Interview', 'Profile', 'home']),
    );
    expect(root.root.findByProps({ testID: 'app-tab-bar' })).toBeTruthy();
  });

  it('hides the tab bar on nested Grammar screens and routes tab presses', async () => {
    mockTabBarProps.state.index = 1;
    mockGetFocusedRouteNameFromRoute.mockReturnValue('GrammarTopic');
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<MainTabNavigator />);
    });
    expect(root.root.findAllByProps({ testID: 'app-tab-bar' })).toHaveLength(0);

    mockGetFocusedRouteNameFromRoute.mockReturnValue('VocabularyHome');
    mockTabBarProps.state.index = 2;
    await act(() => {
      root.update(<MainTabNavigator />);
    });
    expect(root.root.findByProps({ testID: 'app-tab-bar' }).props.children).toBe('vocabulary');

    await act(() => {
      root.root.findByProps({ testID: 'tab-select-grammar' }).props.onPress();
      root.root.findByProps({ testID: 'tab-select-vocabulary' }).props.onPress();
      root.root.findByProps({ testID: 'tab-select-home' }).props.onPress();
      root.root.findByProps({ testID: 'tab-select-interview' }).props.onPress();
      root.root.findByProps({ testID: 'tab-select-profile' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Grammar', { screen: 'GrammarHome' });
    expect(mockNavigate).toHaveBeenCalledWith('Vocabulary', { screen: 'VocabularyHome' });
    expect(mockNavigate).toHaveBeenCalledWith('Home');
    expect(mockNavigate).toHaveBeenCalledWith('Profile');
    expect(mockNavigate).not.toHaveBeenCalledWith('Interview');

    mockGetFocusedRouteNameFromRoute.mockReturnValue('VocabularySituation');
    mockTabBarProps.state.index = 2;
    await act(() => {
      root.update(<MainTabNavigator />);
    });
    expect(root.root.findAllByProps({ testID: 'app-tab-bar' })).toHaveLength(0);

    jest.mocked(useFeatureFlags).mockReturnValue({
      data: { grammar: true, vocabulary: true, interview: true, ai: false },
    } as never);
    mockGetFocusedRouteNameFromRoute.mockReturnValue(undefined);
    mockTabBarProps.state.index = 3;
    await act(() => {
      root.update(<MainTabNavigator />);
    });
    await act(() => {
      root.root.findByProps({ testID: 'tab-select-interview' }).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Interview');
  });
});
