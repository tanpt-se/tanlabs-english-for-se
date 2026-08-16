import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { VocabularyLibraryScreen } from '@/features/vocabulary/screens/VocabularyLibraryScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const routeParams: { situationId?: string } = {};

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react') as typeof import('react');
  const actual = jest.requireActual(
    '@react-navigation/native',
  ) as typeof import('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({ params: routeParams }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      ReactLib.useEffect(effect, [effect]);
    },
  };
});

jest.mock('@/features/vocabulary/data/knownItemsStore', () => ({
  loadKnownItemIds: jest.fn(async () => new Set<string>()),
  toggleItemKnown: jest.fn(async () => true),
}));

jest.mock('@/features/vocabulary/hooks', () => {
  const actual = jest.requireActual(
    '@/features/vocabulary/hooks',
  ) as typeof import('@/features/vocabulary/hooks');
  return {
    ...actual,
    useVocabularySituations: jest.fn(() => ({
      data: [
        { id: 'task-progress', slug: 'task-progress', title: 'Task & Progress' },
        { id: 'meetings', slug: 'meetings', title: 'Meetings' },
        { id: 'bugs-problems', slug: 'bugs-problems', title: 'Bugs & Problems' },
      ],
    })),
    useVocabularyLibrary: jest.fn(() => ({
      data: {
        items: [
          {
            id: 'task-progress:blocker',
            text: 'blocker',
            pos: 'expr',
            situationSlug: 'task-progress',
          },
        ],
        total: 41,
        offset: 0,
        limit: 40,
      },
      isLoading: false,
      isError: false,
      error: null,
    })),
  };
});

const { useVocabularyLibrary, useVocabularySituations } = jest.requireMock(
  '@/features/vocabulary/hooks',
) as {
  useVocabularyLibrary: jest.Mock;
  useVocabularySituations: jest.Mock;
};
const { toggleItemKnown } = jest.requireMock('@/features/vocabulary/data/knownItemsStore') as {
  toggleItemKnown: jest.Mock;
};

describe('VocabularyLibraryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    routeParams.situationId = undefined;
  });

  it('searches, filters, paginates, and opens term detail', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<VocabularyLibraryScreen />);
      await Promise.resolve();
    });

    const labels = root.root.findAllByType(Text).map((node) => {
      const children = node.props.children;
      return Array.isArray(children) ? children.join('') : String(children);
    });
    expect(labels.some((label) => label.includes('blocker'))).toBe(true);
    expect(labels.some((label) => label.includes('41 terms'))).toBe(true);

    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-library-search' }).props.onChangeText('block');
    });
    await act(() => {
      root.root
        .findByProps({ testID: 'vocabulary-library-situation-task-progress' })
        .props.onPress();
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-library-level' }).props.onChange('A2');
    });
    await act(() => {
      root.root.findByProps({ testID: 'vocabulary-library-more' }).props.onPress();
    });
    expect(useVocabularyLibrary).toHaveBeenCalled();

    await act(() => {
      root.root
        .findByProps({ testID: 'vocabulary-library-situation-bugs-problems' })
        .props.onPress();
    });

    const knownToggle = root.root.find(
      (node) =>
        typeof node.props?.testID === 'string' && node.props.testID.startsWith('known-toggle-'),
    );
    await act(async () => {
      knownToggle.props.onPress();
      await Promise.resolve();
    });
    expect(toggleItemKnown).toHaveBeenCalledWith('task-progress:blocker');

    await act(() => {
      const row = root.root.find(
        (node) =>
          node.props?.accessibilityRole === 'button' &&
          typeof node.props?.accessibilityLabel === 'string' &&
          String(node.props.accessibilityLabel).startsWith('blocker'),
      );
      row.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      'VocabularyTerm',
      expect.objectContaining({
        situationId: 'task-progress',
        itemId: 'task-progress:blocker',
      }),
    );
  });

  it('covers loading, error, and missing page states', async () => {
    routeParams.situationId = 'meetings';
    useVocabularyLibrary.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      root = ReactTestRenderer.create(<VocabularyLibraryScreen />);
      await Promise.resolve();
    });
    expect(root.root.findByProps({ testID: 'vocabulary-library-loading' })).toBeTruthy();

    useVocabularyLibrary.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('offline'),
    });
    await act(() => {
      root.update(<VocabularyLibraryScreen />);
    });
    expect(
      root.root
        .findAllByType(Text)
        .some((node) => String(node.props.children).includes('Couldn’t load the library')),
    ).toBe(true);

    useVocabularySituations.mockReturnValue({ data: [] });
    toggleItemKnown.mockResolvedValueOnce(false);
    useVocabularyLibrary.mockReturnValue({
      data: {
        items: [{ id: 'task-progress:ship', text: 'ship', pos: 'v' }],
        total: 1,
        offset: 0,
        limit: 40,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    await act(() => {
      root.update(<VocabularyLibraryScreen />);
    });
    const labels = root.root.findAllByType(Text).map((node) => {
      const children = node.props.children;
      return Array.isArray(children) ? children.join('') : String(children);
    });
    expect(labels.some((label) => label.includes('1 term'))).toBe(true);
    const knownToggle = root.root.find(
      (node) =>
        typeof node.props?.testID === 'string' && node.props.testID.startsWith('known-toggle-'),
    );
    await act(async () => {
      knownToggle.props.onPress();
      await Promise.resolve();
    });
    await act(() => {
      const row = root.root.find(
        (node) =>
          node.props?.accessibilityRole === 'button' &&
          typeof node.props?.accessibilityLabel === 'string' &&
          String(node.props.accessibilityLabel).startsWith('ship'),
      );
      row.props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith(
      'VocabularyTerm',
      expect.objectContaining({ itemId: 'task-progress:ship' }),
    );
    expect(
      root.root.findAll((node) => node.props?.testID === 'vocabulary-library-more'),
    ).toHaveLength(0);
  });
});
