import type {
  ChooseExpressionExercise,
  FillBlankExercise,
  SentenceOrderExercise,
  VocabularyExercise,
} from '@/features/vocabulary/types/content';

export const VOCAB_FEEDBACK = {
  expression: 'blocker',
  meaning: 'Something that stops progress',
  context: 'Standup',
  example: 'I am blocked by the API.',
  explanation: 'Name the blocker clearly.',
};

export const FIXTURE_CHOOSE: ChooseExpressionExercise = {
  id: 'task-progress:ce1',
  situationId: 'task-progress',
  itemId: 'task-progress:blocker',
  type: 'choose_expression',
  prompt: 'Choose the best expression: Something that stops progress',
  payload: {
    options: [
      { id: 'opt_a', text: 'blocker' },
      { id: 'opt_b', text: 'ship' },
      { id: 'opt_c', text: 'merge' },
      { id: 'opt_d', text: 'deploy' },
    ],
  },
  answer: { optionId: 'opt_a' },
  feedback: VOCAB_FEEDBACK,
  sortOrder: 1,
  contentSchemaVersion: 1,
};

export const FIXTURE_CHOOSE_SECOND: ChooseExpressionExercise = {
  ...FIXTURE_CHOOSE,
  id: 'task-progress:ce2',
  itemId: 'task-progress:ship',
  prompt: 'Choose the best expression: Deliver to production',
  answer: { optionId: 'opt_b' },
  feedback: {
    ...VOCAB_FEEDBACK,
    expression: 'ship',
    meaning: 'Deliver to production',
  },
  sortOrder: 2,
};

export const FIXTURE_FILL: FillBlankExercise = {
  id: 'task-progress:fb1',
  situationId: 'task-progress',
  itemId: 'task-progress:blocker',
  type: 'fill_blank',
  prompt: 'Fill in the blank: I hit a ___ on auth.',
  payload: { accepted: ['blocker', 'Blocker'], cue: 'blocker' },
  answer: { accepted: ['blocker', 'Blocker'] },
  feedback: VOCAB_FEEDBACK,
  sortOrder: 3,
  contentSchemaVersion: 1,
};

export const FIXTURE_ORDER: SentenceOrderExercise = {
  id: 'task-progress:so1',
  situationId: 'task-progress',
  itemId: 'task-progress:blocked',
  type: 'sentence_order',
  prompt: 'Put the words in order',
  payload: {
    tokens: [
      { id: 't1', text: 'I' },
      { id: 't2', text: 'am' },
      { id: 't3', text: 'blocked.' },
    ],
  },
  answer: { tokenIds: ['t1', 't2', 't3'] },
  feedback: VOCAB_FEEDBACK,
  sortOrder: 4,
  contentSchemaVersion: 1,
};

export const FIXTURE_EXERCISES: VocabularyExercise[] = [
  FIXTURE_CHOOSE,
  FIXTURE_CHOOSE_SECOND,
  FIXTURE_FILL,
  FIXTURE_ORDER,
];

/** Tiny packs.json shape for localPackCatalog unit tests (do not import real packs). */
export const TINY_VOCABULARY_PACKS = {
  contentSchemaVersion: 1,
  situations: [
    {
      slug: 'task-progress',
      title: 'Task & Progress',
      description: 'Talk about work status.',
      sortOrder: 1,
      items: [
        {
          key: 'blocker',
          type: 'expression' as const,
          term: "I'm blocked by the API dependency.",
          meaning: 'Something that stops progress',
          context: 'Standup',
          level: 'A2',
          sortOrder: 1,
          pos: 'expression',
          patterns: ['be blocked by'],
          examples: [['standup', 'I am blocked by the API.']] as [string, string][],
          alternatives: ['stuck on'],
          notes: ['Use in standup'],
          exercises: [
            {
              key: 'blocker-ce',
              type: 'choose_expression' as const,
              prompt: 'Something that stops progress',
              payload: {
                options: [
                  { id: 'opt_a', text: 'blocker' },
                  { id: 'opt_b', text: 'ship' },
                ],
                correctOptionId: 'opt_a',
              },
              feedback: {
                expression: 'blocker',
                meaning: 'Something that stops progress',
                explanation: 'Name the blocker.',
              },
              sortOrder: 1,
            },
            {
              key: 'blocker-fb',
              type: 'fill_blank' as const,
              prompt: 'I hit a ___ on auth.',
              payload: { accepted: ['blocker'] },
              sortOrder: 2,
            },
            {
              key: 'blocker-so',
              type: 'sentence_order' as const,
              prompt: 'Order',
              payload: {
                tokens: [
                  { id: 't1', text: 'I' },
                  { id: 't2', text: 'am' },
                  { id: 't3', text: 'blocked.' },
                ],
                correctOrder: ['t1', 't2', 't3'],
              },
              sortOrder: 3,
            },
          ],
        },
        {
          key: 'ship',
          type: 'word' as const,
          term: 'ship',
          meaning: 'Deliver to production',
          context: 'Release',
          level: 'B1',
          sortOrder: 2,
          exercises: [
            {
              key: 'ship-ce',
              type: 'choose_expression' as const,
              prompt: 'Deliver to production',
              payload: {
                options: [
                  { id: 'opt_a', text: 'ship' },
                  { id: 'opt_b', text: 'blocker' },
                ],
                correctOptionId: 'opt_a',
              },
              sortOrder: 1,
            },
          ],
        },
        {
          key: 'merge',
          type: 'word' as const,
          term: 'merge',
          meaning: 'Combine branches',
          context: 'PR',
          level: 'B2',
          sortOrder: 3,
          // no choose_expression — exercises optional for fallback practice path
        },
      ],
    },
    {
      slug: 'meetings',
      title: 'Meetings',
      description: 'Meeting talk.',
      sortOrder: 2,
      items: [
        {
          key: 'agenda',
          type: 'word' as const,
          term: 'agenda',
          meaning: 'Meeting plan',
          context: 'Kickoff',
          level: 'A2',
          sortOrder: 1,
        },
        {
          key: 'action-item',
          type: 'word' as const,
          term: 'action item',
          meaning: 'Follow-up task',
          context: 'Kickoff',
          level: 'B1',
          sortOrder: 2,
          // no examples → insightBody falls back to meaning on reverse path
        },
      ],
    },
    {
      slug: 'bugs-problems',
      title: 'Bugs & Problems',
      description: 'Incidents.',
      sortOrder: 3,
      items: [],
    },
    {
      slug: 'daily-standup',
      title: 'Daily Standup',
      description: 'Standup.',
      sortOrder: 4,
      items: [
        {
          key: 'update',
          type: 'word' as const,
          term: 'update',
          meaning: 'Status share',
          context: 'Standup',
          level: 'C1',
          sortOrder: 1,
          examples: [['ex', 'Here is my update.']] as [string, string][],
        },
        {
          key: 'blocker2',
          type: 'word' as const,
          term: 'impediment',
          meaning: 'Another blocker word',
          context: 'Standup',
          level: 'B2',
          sortOrder: 2,
        },
        {
          key: 'plan',
          type: 'word' as const,
          term: 'plan',
          meaning: 'What I will do next',
          context: 'Standup',
          level: 'A2',
          sortOrder: 3,
        },
        {
          key: 'done',
          type: 'word' as const,
          term: 'done',
          meaning: 'Finished work',
          context: 'Standup',
          level: 'A2',
          sortOrder: 4,
        },
      ],
    },
    {
      slug: 'client-communication',
      title: 'Client Communication',
      description: 'Clients.',
      sortOrder: 5,
      items: [
        {
          key: 'clarify',
          type: 'word' as const,
          term: 'clarify',
          meaning: 'Make clear',
          context: 'Email',
          level: 'B1',
          sortOrder: 1,
          exercises: [
            {
              key: 'bad-ce',
              type: 'choose_expression' as const,
              prompt: 'x',
              payload: { options: [{ id: 'a', text: 'a' }], correctOptionId: 'a' },
              sortOrder: 1,
            },
          ],
        },
      ],
    },
  ],
};
