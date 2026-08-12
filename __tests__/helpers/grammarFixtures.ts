import type {
  FillBlankExercise,
  GrammarExercise,
  GrammarLessonDefinition,
  MultipleChoiceExercise,
  SentenceOrderExercise,
} from '@/features/grammar/types/content';
import {
  EXERCISE_CONTENT_SCHEMA_VERSION,
  LESSON_CONTENT_SCHEMA_VERSION,
} from '@/features/grammar/types/content';

/** Tiny in-test fixtures — catalogs are empty; runtime content comes from Supabase. */
export const FIXTURE_LESSON: GrammarLessonDefinition = {
  slug: 'present-simple-a2-form',
  topicSlug: 'present-simple',
  title: 'A2 · Form',
  description: 'Use Present Simple for habits and facts in standups.',
  level: 'A2',
  sortOrder: 1,
  contentSchemaVersion: LESSON_CONTENT_SCHEMA_VERSION,
  contentRevision: 1,
  content: {
    usage: 'Use Present Simple for habits and facts in standups.',
    forms: {
      affirmative: 'I/you/we/they + V · he/she/it + V-s',
      negative: "don't / doesn't + V",
      question: 'Do / Does + subject + V?',
    },
    examples: [
      {
        id: 'ex-1',
        context: 'Standup',
        sentence: 'I ship small fixes every morning.',
      },
      {
        id: 'ex-2',
        context: 'Docs',
        sentence: 'This service retries failed jobs.',
      },
      {
        id: 'ex-3',
        context: 'Support',
        sentence: 'She owns the payment webhook.',
      },
      {
        id: 'ex-4',
        context: 'Ops',
        sentence: 'Nightly backups finish before dawn.',
      },
      {
        id: 'ex-5',
        context: 'Team',
        sentence: 'We review pull requests on Fridays.',
      },
    ],
    tips: ['Third-person singular adds -s.', 'Use for routines, not live work-in-progress.'],
  },
};

export const FIXTURE_MC: MultipleChoiceExercise = {
  id: 'fixture-mc-1',
  topicSlug: 'present-simple',
  lessonSlug: FIXTURE_LESSON.slug,
  type: 'multiple_choice',
  prompt: 'Choose the correct form: She ___ daily deploys.',
  explanation: 'Third person singular takes -s.',
  sortOrder: 1,
  contentSchemaVersion: EXERCISE_CONTENT_SCHEMA_VERSION,
  payload: {
    options: [
      { id: 'a', label: 'run' },
      { id: 'b', label: 'runs' },
      { id: 'c', label: 'running' },
    ],
  },
  answer: { optionId: 'b' },
};

export const FIXTURE_FILL: FillBlankExercise = {
  id: 'fixture-fill-1',
  topicSlug: 'present-simple',
  lessonSlug: FIXTURE_LESSON.slug,
  type: 'fill_blank',
  prompt: 'We ___ (do · negative) merge straight to main.',
  explanation: "Negation uses don't for I/you/we/they.",
  sortOrder: 2,
  contentSchemaVersion: EXERCISE_CONTENT_SCHEMA_VERSION,
  payload: { template: 'We ___ (do · negative) merge straight to main.' },
  answer: { accepted: ["don't", 'do not'] },
};

export const FIXTURE_ORDER: SentenceOrderExercise = {
  id: 'fixture-order-1',
  topicSlug: 'present-simple',
  lessonSlug: FIXTURE_LESSON.slug,
  type: 'sentence_order',
  prompt: 'Order the tokens.',
  explanation: 'Subject before the verb in affirmative Present Simple.',
  sortOrder: 3,
  contentSchemaVersion: EXERCISE_CONTENT_SCHEMA_VERSION,
  payload: {
    tokens: [
      { id: 't1', text: 'The' },
      { id: 't2', text: 'pipeline' },
      { id: 't3', text: 'runs' },
      { id: 't4', text: 'nightly.' },
    ],
  },
  answer: { tokenIds: ['t1', 't2', 't3', 't4'] },
};

export const FIXTURE_MC_SECOND: MultipleChoiceExercise = {
  ...FIXTURE_MC,
  id: 'fixture-mc-2',
  sortOrder: 4,
  prompt: 'Choose: The API ___ timeouts.',
  payload: {
    options: [
      { id: 'a', label: 'handle' },
      { id: 'b', label: 'handles' },
      { id: 'c', label: 'handling' },
    ],
  },
  answer: { optionId: 'b' },
};

export const FIXTURE_EXERCISES: GrammarExercise[] = [
  FIXTURE_MC,
  FIXTURE_FILL,
  FIXTURE_ORDER,
  FIXTURE_MC_SECOND,
];
