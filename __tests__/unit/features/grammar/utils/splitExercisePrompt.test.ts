import {
  fillBlankInstruction,
  fillBlankPlaceholder,
  parseFillBlankCue,
} from '@/features/grammar/utils/fillBlankCue';
import { splitExercisePrompt } from '@/features/grammar/utils/splitExercisePrompt';

describe('splitExercisePrompt', () => {
  it('splits a baked-in Choose the correct form prefix', () => {
    expect(
      splitExercisePrompt('Choose the correct form: She ___ the release notes.', 'multiple_choice'),
    ).toEqual({
      instruction: 'Choose the correct form',
      stem: 'She ___ the release notes.',
    });
  });

  it('uses type defaults when the prompt is already the stem', () => {
    expect(splitExercisePrompt('Order these tokens for standup.', 'sentence_order')).toEqual({
      instruction: 'Put the words in order',
      stem: 'Order these tokens for standup.',
    });
  });

  it('maps fill-blank polarity cues into the instruction', () => {
    expect(splitExercisePrompt('We ___ (do · negative) deploy on Fridays.', 'fill_blank')).toEqual({
      instruction: 'Fill with a negative form',
      stem: 'We ___ (do · negative) deploy on Fridays.',
    });
    expect(
      splitExercisePrompt('I ___ (be · affirmative) updating the runbook.', 'fill_blank'),
    ).toEqual({
      instruction: 'Fill with an affirmative form',
      stem: 'I ___ (be · affirmative) updating the runbook.',
    });
    expect(splitExercisePrompt('___ (do · question) the cron still run?', 'fill_blank')).toEqual({
      instruction: 'Fill with a question form',
      stem: '___ (do · question) the cron still run?',
    });
  });
});

describe('fillBlankCue', () => {
  it('parses lemma and polarity for placeholders', () => {
    const cue = parseFillBlankCue('We ___ (do · negative) merge.');
    expect(cue).toEqual({ raw: 'do · negative', lemma: 'do', polarity: 'negative' });
    expect(fillBlankInstruction(cue!.polarity)).toBe('Fill with a negative form');
    expect(fillBlankPlaceholder(cue)).toBe('Type the negative form of "do"');
  });

  it('handles missing and non-polarity cues', () => {
    expect(parseFillBlankCue('No placeholder here')).toBeNull();
    expect(fillBlankInstruction(null)).toBe('Fill in the blank');
    expect(fillBlankPlaceholder(null)).toBe('Type your answer');

    const plainCue = parseFillBlankCue('Use ___ (deploy/release) today.');
    expect(plainCue).toEqual({
      raw: 'deploy/release',
      lemma: 'deploy/release',
      polarity: null,
    });
    expect(fillBlankPlaceholder(plainCue)).toBe('deploy/release');

    const affirmativeCue = parseFillBlankCue('I ___ (be · affirmative) here.');
    expect(fillBlankPlaceholder(affirmativeCue)).toBe('Type "be"');

    const questionCue = parseFillBlankCue('___ (do · question) this work?');
    expect(fillBlankPlaceholder(questionCue)).toBe('Type the question form of "do"');
  });
});
