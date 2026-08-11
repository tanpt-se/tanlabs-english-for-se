export type VocabularySituation = {
  id: string;
  title: string;
  description: string;
  learned: number;
  total: number;
};

export type VocabularyExpression = {
  id: string;
  text: string;
  tag: string;
  intent?: string;
  needsPractice?: boolean;
};

export type PracticeQuestion = {
  id: string;
  prompt: string;
  question: string;
  options: string[];
  correctIndex: number;
  insightTitle: string;
  insightBody: string;
};

export const VOCABULARY_SITUATIONS: VocabularySituation[] = [
  {
    id: 'daily-standup',
    title: 'Daily Standup',
    description: 'Updates, blockers, priorities',
    learned: 8,
    total: 12,
  },
  {
    id: 'task-progress',
    title: 'Task & Progress',
    description: 'Status, ownership, next steps',
    learned: 3,
    total: 10,
  },
  {
    id: 'meetings',
    title: 'Meetings',
    description: 'Agree, challenge, decide',
    learned: 2,
    total: 14,
  },
  {
    id: 'bugs-problems',
    title: 'Bugs & Problems',
    description: 'Diagnose, explain, propose',
    learned: 2,
    total: 12,
  },
  {
    id: 'client-communication',
    title: 'Client Communication',
    description: 'Clarify, align, follow up',
    learned: 0,
    total: 8,
  },
];

const EXPRESSIONS_BY_SITUATION: Record<string, VocabularyExpression[]> = {
  'task-progress': [
    { id: 'tp-1', text: 'The task is on track.', tag: 'UPDATE' },
    {
      id: 'tp-2',
      text: 'I’m blocked by the API dependency.',
      tag: 'BLOCKER',
      needsPractice: true,
    },
    { id: 'tp-3', text: 'I’ve completed the implementation.', tag: 'PROGRESS' },
    { id: 'tp-4', text: 'The next step is to add tests.', tag: 'NEXT STEP' },
    { id: 'tp-5', text: 'We may need to adjust the estimate.', tag: 'RISK' },
  ],
};

const DEFAULT_EXPRESSIONS: VocabularyExpression[] = [
  { id: 'gen-1', text: 'Let’s align on the next step.', tag: 'ALIGN' },
  { id: 'gen-2', text: 'Can we clarify the requirement?', tag: 'CLARIFY' },
  { id: 'gen-3', text: 'I’ll follow up after the meeting.', tag: 'FOLLOW UP' },
];

const PRACTICE_BY_SITUATION: Record<string, PracticeQuestion[]> = {
  'task-progress': [
    {
      id: 'q1',
      prompt: 'The API dependency is preventing you from continuing.',
      question: 'What would you say?',
      options: [
        'The task is on track.',
        'I’m blocked by the API dependency.',
        'I’ve completed the implementation.',
        'The next step is to add tests.',
      ],
      correctIndex: 1,
      insightTitle: 'Clear and actionable',
      insightBody: '“I’m blocked by…” names the blocker and invites the team to unblock it.',
    },
    {
      id: 'q2',
      prompt: 'You finished the feature and want to share progress.',
      question: 'What would you say?',
      options: [
        'We may need to adjust the estimate.',
        'I’m blocked by the API dependency.',
        'I’ve completed the implementation.',
        'Can we clarify the requirement?',
      ],
      correctIndex: 2,
      insightTitle: 'Clear and actionable',
      insightBody: '“I’ve completed…” states finished work without hedging.',
    },
  ],
};

const DEFAULT_PRACTICE: PracticeQuestion[] = [
  {
    id: 'default-q1',
    prompt: 'You need the team to understand the next action.',
    question: 'What would you say?',
    options: [
      'Let’s align on the next step.',
      'The task is on track.',
      'I’m blocked by the API dependency.',
      'We may need to adjust the estimate.',
    ],
    correctIndex: 0,
    insightTitle: 'Clear and actionable',
    insightBody: 'Naming the next step helps the team move forward together.',
  },
];

export function getSituation(situationId: string): VocabularySituation | undefined {
  return VOCABULARY_SITUATIONS.find((item) => item.id === situationId);
}

export function getExpressions(situationId: string): VocabularyExpression[] {
  return EXPRESSIONS_BY_SITUATION[situationId] ?? DEFAULT_EXPRESSIONS;
}

export function getPracticeQuestions(situationId: string): PracticeQuestion[] {
  return PRACTICE_BY_SITUATION[situationId] ?? DEFAULT_PRACTICE;
}

export function formatProgress(learned: number, total: number): string {
  return `${learned} / ${total}`;
}
