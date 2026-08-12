import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { GrammarTopicRow } from '@/features/grammar/components/GrammarTopicRow';

jest.mock('@/features/grammar/hooks', () => ({
  useGrammarLessons: jest.fn(),
  useGrammarProgress: jest.fn(),
}));

const hooks = jest.requireMock('@/features/grammar/hooks') as {
  useGrammarLessons: jest.Mock;
  useGrammarProgress: jest.Mock;
};

const topic = {
  id: 't1',
  slug: 'present-simple' as const,
  title: 'Present Simple',
  description: 'Strong foundation',
  sortOrder: 1,
  lessonCount: 2,
};

describe('GrammarTopicRow', () => {
  it('renders in-progress, completed, not-started, and empty lesson states', async () => {
    const onPress = jest.fn();
    hooks.useGrammarLessons.mockReturnValue({
      data: [{ id: 'l1' }, { id: 'l2' }],
    });
    hooks.useGrammarProgress.mockReturnValue({
      data: [
        { topicId: 't1', lessonId: 'l1', status: 'completed', bestScore: 90 },
        { topicId: 't1', lessonId: 'l2', status: 'in_progress', bestScore: 50 },
        { topicId: 'other', lessonId: 'x', status: 'completed', bestScore: 100 },
      ],
    });

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(<GrammarTopicRow topic={topic} onPress={onPress} />);
    });
    expect(root.root.findByProps({ testID: 'grammar-topic-present-simple' })).toBeTruthy();

    hooks.useGrammarProgress.mockReturnValue({
      data: [
        { topicId: 't1', lessonId: 'l1', status: 'completed', bestScore: 100 },
        { topicId: 't1', lessonId: 'l2', status: 'completed', bestScore: 100 },
      ],
    });
    await act(() => {
      root.update(<GrammarTopicRow topic={topic} onPress={onPress} />);
    });
    expect(
      root.root.findAll(
        (node) =>
          typeof node.props.children === 'string' && node.props.children === 'Strong foundation',
      ).length,
    ).toBeGreaterThan(0);

    hooks.useGrammarLessons.mockReturnValue({ data: [{ id: 'l1' }] });
    hooks.useGrammarProgress.mockReturnValue({ data: [] });
    await act(() => {
      root.update(<GrammarTopicRow topic={topic} onPress={onPress} />);
    });
    expect(
      root.root.findAll(
        (node) =>
          typeof node.props.children === 'string' &&
          node.props.children === '0% · A2–C1 · Ready to begin',
      ).length,
    ).toBeGreaterThan(0);

    hooks.useGrammarLessons.mockReturnValue({ data: [] });
    await act(() => {
      root.update(<GrammarTopicRow topic={topic} onPress={onPress} />);
    });
    expect(
      root.root.findAll(
        (node) => typeof node.props.children === 'string' && node.props.children === 'Coming soon',
      ).length,
    ).toBeGreaterThan(0);
  });
});
