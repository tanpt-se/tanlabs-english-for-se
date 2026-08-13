import { CommonActions } from '@react-navigation/native';

import { vocabularyErrorMessage } from '@/features/vocabulary/hooks/errorMessage';
import { vocabularyKeys } from '@/features/vocabulary/hooks/queryKeys';
import { exitVocabularyPracticeFlow } from '@/features/vocabulary/navigation/exitPracticeFlow';
import {
  toVocabularyDomainError,
  VocabularyDomainError,
} from '@/features/vocabulary/services/errors';
import { createClientAttemptId } from '@/features/vocabulary/session/createClientAttemptId';
import { assertVocabularyExercise, assertVocabularyLevel } from '@/features/vocabulary/validation';

import { FIXTURE_CHOOSE } from '../../../../helpers/vocabularyFixtures';

describe('vocabulary session helpers + errors + validation', () => {
  it('creates attempt ids with and without crypto.randomUUID', () => {
    expect(createClientAttemptId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });
    expect(createClientAttemptId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('exits practice flow for home/weak/situation targets', () => {
    expect(
      (() => {
        exitVocabularyPracticeFlow({ getParent: () => undefined }, { name: 'VocabularyHome' });
        return true;
      })(),
    ).toBe(true);

    const dispatch = jest.fn();
    const parent = {
      getState: () => ({
        routes: [{ name: 'VocabularyHome' }, { name: 'VocabularyPracticeFlow' }],
      }),
      dispatch,
    };

    exitVocabularyPracticeFlow({ getParent: () => parent }, { name: 'VocabularyHome' });
    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({ index: 0, routes: [{ name: 'VocabularyHome' }] }),
    );

    exitVocabularyPracticeFlow({ getParent: () => parent }, { name: 'VocabularyWeak' });
    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'VocabularyHome' }, { name: 'VocabularyWeak' }],
      }),
    );

    exitVocabularyPracticeFlow(
      {
        getParent: () => ({
          getState: () => ({ routes: [{ name: 'VocabularyPracticeFlow' }] }),
          dispatch,
        }),
      },
      { name: 'VocabularySituation', params: { situationId: 'task-progress' } },
    );
    expect(dispatch).toHaveBeenCalledWith(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'VocabularyHome' },
          { name: 'VocabularySituation', params: { situationId: 'task-progress' } },
        ],
      }),
    );
  });

  it('maps domain errors and validates content', () => {
    const domain = new VocabularyDomainError('not_found', 'Missing');
    expect(toVocabularyDomainError(domain)).toBe(domain);
    expect(toVocabularyDomainError(new Error('x')).code).toBe('unavailable');
    expect(vocabularyErrorMessage(domain, 'fallback')).toBe('Missing');
    expect(vocabularyErrorMessage(new Error('x'), 'fallback')).toBe('fallback');

    expect(() => assertVocabularyExercise(FIXTURE_CHOOSE)).not.toThrow();
    expect(() => assertVocabularyExercise({ ...FIXTURE_CHOOSE, id: '', prompt: '' })).toThrow(
      /missing required/,
    );
    expect(() =>
      assertVocabularyExercise({
        ...FIXTURE_CHOOSE,
        type: 'nope' as typeof FIXTURE_CHOOSE.type,
      } as unknown as Parameters<typeof assertVocabularyExercise>[0]),
    ).toThrow(/Unsupported/);
    expect(() => assertVocabularyExercise({ ...FIXTURE_CHOOSE, contentSchemaVersion: 99 })).toThrow(
      /schema version/,
    );

    expect(() => assertVocabularyLevel('A2')).not.toThrow();
    expect(() => assertVocabularyLevel('Z9')).toThrow(/Unsupported/);

    expect(vocabularyKeys.situations()[0]).toBe('vocabulary');
    expect(vocabularyKeys.situation('s')).toContain('s');
    expect(vocabularyKeys.exercises('s')).toContain('exercises');
    expect(vocabularyKeys.weak('u')).toContain('u');
    expect(vocabularyKeys.attempt('u', 'a')).toContain('a');
    expect(vocabularyKeys.completedSession('a')).toContain('completed-session');
  });
});
