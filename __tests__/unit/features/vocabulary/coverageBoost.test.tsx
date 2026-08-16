import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { ExpressionCard } from '@/features/vocabulary/components/ExpressionCard';
import { LevelSectionHeader } from '@/features/vocabulary/components/LevelSectionHeader';
import { PracticeFeedback } from '@/features/vocabulary/components/PracticeFeedback';
import { PracticeProgressBar } from '@/features/vocabulary/components/PracticeProgressBar';
import { SituationCard } from '@/features/vocabulary/components/SituationCard';
import { TermRow } from '@/features/vocabulary/components/TermRow';
import {
  formatProgress,
  getExpressionListMeta,
  getExpressions,
  getLevelTotals,
  getPracticeQuestions,
  getSituation,
  getTerm,
  isVocabularyLocalPackPreview,
  VOCABULARY_SITUATIONS,
} from '@/features/vocabulary/data/mockCatalog';
import { VocabularyNavigator } from '@/features/vocabulary/navigation/VocabularyNavigator';
import { VocabularyPracticeFlowNavigator } from '@/features/vocabulary/navigation/VocabularyPracticeFlowNavigator';
import type { VocabularyExercise } from '@/features/vocabulary/types/content';
import { aggregateItemResults } from '@/features/vocabulary/utils/aggregateItemResults';
import {
  composeSituationSession,
  composeWeakSession,
} from '@/features/vocabulary/utils/composeSession';
import { gradeExercise } from '@/features/vocabulary/utils/grade';
import { sortWeakItems, isWeakItem } from '@/features/vocabulary/utils/weakItems';

import { FIXTURE_CHOOSE, FIXTURE_FILL, FIXTURE_ORDER } from '../../../helpers/vocabularyFixtures';

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Screen: () => null,
  }),
}));

jest.mock('@/features/vocabulary/session/PracticeSessionProvider', () => ({
  PracticeSessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('vocabulary coverage boost', () => {
  it('renders navigators', async () => {
    await act(() => {
      ReactTestRenderer.create(<VocabularyNavigator />);
    });
    await act(() => {
      ReactTestRenderer.create(<VocabularyPracticeFlowNavigator />);
    });
  });

  it('covers feedback/progress/term/situation/expression chrome branches', async () => {
    const onToggle = jest.fn();
    const onPress = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <>
          <PracticeFeedback correct={false} explanation="nope" correctAnswerLabel="a" />
          <PracticeFeedback correct explanation="yes" correctAnswerLabel="a" />
          <PracticeProgressBar index={0} total={0} />
          <PracticeProgressBar
            index={2}
            total={5}
            canGoBack
            canSkip
            onBack={onPress}
            onSkip={onPress}
          />
          <LevelSectionHeader collapsed count={1} level="B1" onToggle={onToggle} />
          <LevelSectionHeader collapsed={false} count={2} level="B2" onToggle={onToggle} />
          <LevelSectionHeader collapsed={false} count={2} level="C1" onToggle={onToggle} />
          <LevelSectionHeader collapsed={false} count={2} level="ZZ" onToggle={onToggle} />
          <TermRow known term="t" pos="n" onToggleKnown={onToggle} />
          <TermRow
            known={false}
            term="t2"
            pos="v"
            level="A2"
            onPressRow={onPress}
            onToggleKnown={onToggle}
          />
          <ExpressionCard
            emphasis
            meta="needs practice"
            onPress={onPress}
            tag="word · A2"
            title="hello"
          />
          <ExpressionCard tag="word · A2" title="hello" />
          <SituationCard
            title="T"
            description="D"
            progress="1 / 2"
            progressRatio={Number.NaN}
            selected
            onPress={onPress}
          />
          <SituationCard title="T2" description="D2" progress="0 / 2" />
          <SituationCard title="T3" description="D3" progress="2 / 2" progressRatio={1} />
        </>,
      );
    });
    await act(() => {
      root.root.findByProps({ testID: 'level-section-B1' }).props.onPress();
    });
    expect(onToggle).toHaveBeenCalled();
  });

  it('covers grade error branches and compose/weak/aggregate edges', () => {
    expect(gradeExercise(FIXTURE_CHOOSE, { type: 'fill_blank', text: 'x' })).toEqual({
      error: 'Response type mismatch',
    });
    expect(gradeExercise(FIXTURE_CHOOSE, { type: 'choose_expression', optionId: 'nope' })).toEqual({
      error: 'Unknown option id',
    });
    expect(gradeExercise(FIXTURE_FILL, { type: 'fill_blank', text: '   ' })).toEqual({
      error: 'Empty fill-blank response',
    });
    expect(gradeExercise(FIXTURE_ORDER, { type: 'sentence_order', tokenIds: ['t1'] })).toEqual({
      error: 'tokenIds length mismatch',
    });
    expect(
      gradeExercise(FIXTURE_ORDER, { type: 'sentence_order', tokenIds: ['t1', 't2', 'nope'] }),
    ).toEqual({ error: 'Unknown token id' });

    expect(composeSituationSession([FIXTURE_CHOOSE], { random: () => 0 }).ok).toBe(false);
    const pool = Array.from({ length: 12 }, (_, i) => ({
      ...FIXTURE_CHOOSE,
      id: `c${i}`,
      itemId: `task-progress:i${i}`,
      type: (i % 3 === 0 ? 'choose_expression' : i % 3 === 1 ? 'fill_blank' : 'sentence_order') as
        | 'choose_expression'
        | 'fill_blank'
        | 'sentence_order',
      payload:
        i % 3 === 0
          ? FIXTURE_CHOOSE.payload
          : i % 3 === 1
          ? FIXTURE_FILL.payload
          : FIXTURE_ORDER.payload,
      answer:
        i % 3 === 0
          ? FIXTURE_CHOOSE.answer
          : i % 3 === 1
          ? FIXTURE_FILL.answer
          : FIXTURE_ORDER.answer,
    })) as VocabularyExercise[];
    expect(
      composeSituationSession(pool, { preferItemIds: ['task-progress:i1'], random: () => 0 }).ok,
    ).toBe(true);
    expect(composeWeakSession(pool, ['task-progress:i1'], { random: () => 0 }).ok).toBe(true);
    expect(composeWeakSession(pool, ['missing'], { random: () => 0 }).ok).toBe(false);

    expect(
      sortWeakItems([
        {
          itemId: 'b',
          lastResult: true,
          incorrectCount: 3,
          correctCount: 1,
          lastSeenAt: null,
          sortOrder: 2,
        },
        {
          itemId: 'a',
          lastResult: false,
          incorrectCount: 0,
          correctCount: 0,
          lastSeenAt: null,
          sortOrder: 1,
        },
        {
          itemId: 'c',
          lastResult: true,
          incorrectCount: 0,
          correctCount: 9,
          lastSeenAt: '2026-01-01',
          sortOrder: 0,
        },
      ]).map((row) => row.itemId),
    ).toEqual(['a', 'b']);
    expect(
      isWeakItem({
        itemId: 'x',
        lastResult: true,
        incorrectCount: 2,
        correctCount: 1,
        lastSeenAt: null,
        sortOrder: 0,
      }),
    ).toBe(true);

    expect(
      aggregateItemResults([FIXTURE_CHOOSE], [{ exerciseId: 'missing', correct: true }]),
    ).toEqual([]);
    expect(
      aggregateItemResults(
        [{ ...FIXTURE_CHOOSE, itemId: undefined as unknown as string }],
        [{ exerciseId: FIXTURE_CHOOSE.id, correct: true }],
      ),
    ).toEqual([]);
  });

  it('covers mockCatalog helpers', () => {
    expect(VOCABULARY_SITUATIONS.length).toBeGreaterThan(0);
    expect(getSituation('task-progress')?.title).toContain('Task');
    expect(getExpressions('task-progress').length).toBeGreaterThan(0);
    expect(getExpressions('unknown-situation').length).toBeGreaterThan(0);
    expect(Object.keys(getLevelTotals('task-progress')).length).toBeGreaterThan(0);
    expect(getExpressionListMeta('task-progress').capped).toBe(false);
    expect(getTerm('task-progress', 'task-progress:tp-2')?.term).toBeTruthy();
    expect(getTerm('missing', 'x')).toBeUndefined();
    expect(getPracticeQuestions('task-progress').length).toBeGreaterThan(0);
    expect(getPracticeQuestions('nope').length).toBeGreaterThan(0);
    expect(formatProgress(1, 10)).toBe('1 / 10');
    expect(typeof isVocabularyLocalPackPreview()).toBe('boolean');
  });
});
