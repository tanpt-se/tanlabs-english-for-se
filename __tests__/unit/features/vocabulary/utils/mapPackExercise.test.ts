import { mapPackExercise } from '@/features/vocabulary/utils/mapPackExercise';

const item = {
  key: 'blocker',
  term: 'blocker',
  meaning: 'Something that stops progress',
  context: 'Standup',
  examples: [['standup', 'I am blocked.']] as [string, string][],
};

describe('mapPackExercise', () => {
  it('maps choose_expression and rejects incomplete payloads', () => {
    expect(
      mapPackExercise('task-progress', item, {
        key: 'ce1',
        type: 'choose_expression',
        prompt: 'x',
        payload: {
          options: [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
          ],
          correctOptionId: 'a',
        },
      }),
    ).toMatchObject({
      id: 'task-progress:ce1',
      type: 'choose_expression',
      answer: { optionId: 'a' },
    });

    expect(
      mapPackExercise('task-progress', item, {
        key: 'ce-bad',
        type: 'choose_expression',
        prompt: 'x',
        payload: { options: [{ id: 'a', text: 'A' }], correctOptionId: 'a' },
      }),
    ).toBeNull();

    expect(
      mapPackExercise('task-progress', item, {
        key: 'ce-bad2',
        type: 'choose_expression',
        prompt: 'x',
        payload: {
          options: [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
          ],
        },
      }),
    ).toBeNull();
  });

  it('maps fill_blank and sentence_order with defaults', () => {
    const fill = mapPackExercise('task-progress', item, {
      key: 'fb1',
      type: 'fill_blank',
      prompt: 'I hit a ___',
      payload: { accepted: ['blocker'], cue: 'word' },
    });
    expect(fill).toMatchObject({
      type: 'fill_blank',
      answer: { accepted: ['blocker'] },
      payload: { cue: 'word' },
    });

    expect(
      mapPackExercise('task-progress', item, {
        key: 'fb-bad',
        type: 'fill_blank',
        prompt: 'no blank',
        payload: { accepted: ['x'] },
      }),
    ).toBeNull();

    const order = mapPackExercise('task-progress', item, {
      key: 'so1',
      type: 'sentence_order',
      prompt: 'Order',
      payload: {
        tokens: [
          { id: 't1', text: 'I' },
          { id: 't2', text: 'am' },
          { id: 't3', text: 'blocked.' },
        ],
        correctOrder: ['t1', 't2', 't3'],
      },
    });
    expect(order).toMatchObject({
      type: 'sentence_order',
      answer: { tokenIds: ['t1', 't2', 't3'] },
    });

    expect(
      mapPackExercise('task-progress', item, {
        key: 'so-bad',
        type: 'sentence_order',
        prompt: 'Order',
        payload: { tokens: [{ id: 't1', text: 'I' }], correctOrder: ['t1'] },
      }),
    ).toBeNull();
  });

  it('returns null for unknown types and uses feedback fallbacks', () => {
    expect(
      mapPackExercise('task-progress', item, {
        key: 'x',
        type: 'unknown',
        prompt: 'x',
        payload: {},
      }),
    ).toBeNull();

    const mapped = mapPackExercise(
      'task-progress',
      { key: 'x', term: 'term', meaning: 'm', context: 'c' },
      {
        key: 'ce',
        type: 'choose_expression',
        prompt: 'p',
        payload: {
          options: [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
          ],
          correctOptionId: 'a',
        },
      },
    );
    expect(mapped?.feedback.expression).toBe('term');
    expect(mapped?.feedback.example).toBe('term');
    expect(mapped?.feedback.explanation).toContain('term');
  });
});
