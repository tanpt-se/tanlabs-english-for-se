import { CommonActions } from '@react-navigation/native';

import { exitGrammarPracticeFlow } from '@/features/grammar/navigation/exitPracticeFlow';

describe('exitGrammarPracticeFlow', () => {
  it('returns early when no parent navigator exists', () => {
    const dispatch = jest.fn();
    exitGrammarPracticeFlow(
      {
        getParent: () => undefined,
      },
      { name: 'GrammarHome' },
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('resets to GrammarHome target', () => {
    const dispatch = jest.fn();
    exitGrammarPracticeFlow(
      {
        getParent: () => ({
          getState: () => ({
            routes: [{ name: 'GrammarHome' }, { name: 'GrammarPracticeFlow' }],
          }),
          dispatch,
        }),
      },
      { name: 'GrammarHome' },
    );

    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'GrammarHome' }],
      }),
    );
  });

  it('keeps home and navigates to topic target', () => {
    const dispatch = jest.fn();
    exitGrammarPracticeFlow(
      {
        getParent: () => ({
          getState: () => ({
            routes: [{ name: 'GrammarPracticeFlow' }],
          }),
          dispatch,
        }),
      },
      { name: 'GrammarTopic', params: { topicId: 'topic-1' } },
    );

    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'GrammarHome' }, { name: 'GrammarTopic', params: { topicId: 'topic-1' } }],
      }),
    );
  });

  it('builds home/topic fallback when targeting lesson', () => {
    const dispatch = jest.fn();
    exitGrammarPracticeFlow(
      {
        getParent: () => ({
          getState: () => ({
            routes: [{ name: 'GrammarPracticeFlow' }],
          }),
          dispatch,
        }),
      },
      { name: 'GrammarLesson', params: { topicId: 'topic-2', lessonId: 'lesson-2' } },
    );

    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 2,
        routes: [
          { name: 'GrammarHome' },
          { name: 'GrammarTopic', params: { topicId: 'topic-2' } },
          { name: 'GrammarLesson', params: { topicId: 'topic-2', lessonId: 'lesson-2' } },
        ],
      }),
    );
  });
});
