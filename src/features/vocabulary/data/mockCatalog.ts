import { VOCABULARY_FORCE_LOCAL_SEED } from '@/app/config/env';
import { VOCABULARY_PREVIEW_LIST_LIMIT } from '@/features/vocabulary/data/catalogConstants';
import {
  getLocalExpressions,
  getLocalExpressionTotal,
  getLocalLevelTotals,
  getLocalPracticeQuestions,
  getLocalSituation,
  getLocalSituations,
  getLocalTerm,
} from '@/features/vocabulary/data/localPackCatalog';
import type { VocabularyTermDetail } from '@/features/vocabulary/types/catalog';
import { normalizeCefrLevel, type CefrLevel } from '@/features/vocabulary/utils/levels';
import { resolvePos, type VocabularyPos } from '@/features/vocabulary/utils/pos';

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
  level: CefrLevel;
  pos: VocabularyPos;
  context?: string;
};

export type PracticeQuestion = {
  id: string;
  itemId?: string;
  prompt: string;
  question: string;
  options: string[];
  correctIndex: number;
  insightTitle: string;
  insightBody: string;
};

export type { VocabularyTermDetail };

const MOCK_SITUATIONS: VocabularySituation[] = [
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
    {
      id: 'task-progress:tp-1',
      text: 'The task is on track.',
      tag: 'UPDATE',
      level: 'A2',
      pos: 'expr',
      intent: 'Status is healthy and progressing as planned.',
      context: 'Status',
    },
    {
      id: 'task-progress:tp-2',
      text: "I'm blocked by the API dependency.",
      tag: 'BLOCKER',
      needsPractice: true,
      level: 'A2',
      pos: 'expr',
      intent: 'Name a blocker that stops progress.',
      context: 'Blocker',
    },
    {
      id: 'task-progress:tp-3',
      text: "I've completed the implementation.",
      tag: 'PROGRESS',
      level: 'A2',
      pos: 'expr',
      intent: 'Report finished implementation work.',
      context: 'Progress',
    },
    {
      id: 'task-progress:tp-4',
      text: 'The next step is to add tests.',
      tag: 'NEXT STEP',
      level: 'B1',
      pos: 'expr',
      intent: 'State the concrete next action.',
      context: 'Next step',
    },
    {
      id: 'task-progress:tp-5',
      text: 'We may need to adjust the estimate.',
      tag: 'RISK',
      level: 'B1',
      pos: 'expr',
      intent: 'Surface estimate risk without panic.',
      context: 'Risk',
    },
    {
      id: 'task-progress:tp-6',
      text: 'progressive delivery',
      tag: 'RELEASE',
      level: 'C1',
      pos: 'phr',
      intent: 'Gradually increase exposure of a release based on signals.',
      context: 'Deploy',
    },
  ],
};

const DEFAULT_EXPRESSIONS: VocabularyExpression[] = [
  {
    id: 'gen-1',
    text: "Let's align on the next step.",
    tag: 'ALIGN',
    level: 'A2',
    pos: 'expr',
    intent: 'Invite the team to agree on the next action.',
    context: 'Align',
  },
  {
    id: 'gen-2',
    text: 'Can we clarify the requirement?',
    tag: 'CLARIFY',
    level: 'A2',
    pos: 'expr',
    intent: 'Ask for a clearer requirement.',
    context: 'Clarify',
  },
  {
    id: 'gen-3',
    text: "I'll follow up after the meeting.",
    tag: 'FOLLOW UP',
    level: 'B1',
    pos: 'expr',
    intent: 'Commit to a post-meeting follow-up.',
    context: 'Follow-up',
  },
];

const PRACTICE_BY_SITUATION: Record<string, PracticeQuestion[]> = {
  'task-progress': [
    {
      id: 'q1',
      prompt: 'The API dependency is preventing you from continuing.',
      question: 'What would you say?',
      options: [
        'The task is on track.',
        "I'm blocked by the API dependency.",
        "I've completed the implementation.",
        'The next step is to add tests.',
      ],
      correctIndex: 1,
      insightTitle: 'Clear and actionable',
      insightBody: '"I\'m blocked by…" names the blocker and invites the team to unblock it.',
    },
    {
      id: 'q2',
      prompt: 'You finished the feature and want to share progress.',
      question: 'What would you say?',
      options: [
        'We may need to adjust the estimate.',
        "I'm blocked by the API dependency.",
        "I've completed the implementation.",
        'Can we clarify the requirement?',
      ],
      correctIndex: 2,
      insightTitle: 'Clear and actionable',
      insightBody: '"I\'ve completed…" states finished work without hedging.',
    },
  ],
};

const DEFAULT_PRACTICE: PracticeQuestion[] = [
  {
    id: 'default-q1',
    prompt: 'You need the team to understand the next action.',
    question: 'What would you say?',
    options: [
      "Let's align on the next step.",
      'The task is on track.',
      "I'm blocked by the API dependency.",
      'We may need to adjust the estimate.',
    ],
    correctIndex: 0,
    insightTitle: 'Clear and actionable',
    insightBody: 'Naming the next step helps the team move forward together.',
  },
];

export const VOCABULARY_SITUATIONS: VocabularySituation[] = VOCABULARY_FORCE_LOCAL_SEED
  ? getLocalSituations()
  : MOCK_SITUATIONS;

export function getSituation(situationId: string): VocabularySituation | undefined {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    return getLocalSituation(situationId);
  }
  return MOCK_SITUATIONS.find((item) => item.id === situationId);
}

export function getExpressions(situationId: string): VocabularyExpression[] {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    return getLocalExpressions(situationId);
  }
  return EXPRESSIONS_BY_SITUATION[situationId] ?? DEFAULT_EXPRESSIONS;
}

export function getLevelTotals(situationId: string): Partial<Record<CefrLevel, number>> {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    return getLocalLevelTotals(situationId);
  }
  const totals: Partial<Record<CefrLevel, number>> = {};
  for (const item of getExpressions(situationId)) {
    const level = normalizeCefrLevel(item.level);
    totals[level] = (totals[level] ?? 0) + 1;
  }
  return totals;
}

export function getExpressionListMeta(situationId: string): {
  shown: number;
  total: number;
  capped: boolean;
} {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    const total = getLocalExpressionTotal(situationId);
    const shown = Math.min(total, VOCABULARY_PREVIEW_LIST_LIMIT);
    return { shown, total, capped: total > shown };
  }
  const expressions = getExpressions(situationId);
  return { shown: expressions.length, total: expressions.length, capped: false };
}

export function getTerm(situationId: string, itemId: string): VocabularyTermDetail | undefined {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    return getLocalTerm(situationId, itemId);
  }
  const expression =
    getExpressions(situationId).find((item) => item.id === itemId) ??
    DEFAULT_EXPRESSIONS.find((item) => item.id === itemId);
  if (!expression) {
    return undefined;
  }
  return {
    id: expression.id,
    situationId,
    term: expression.text,
    type: 'expression',
    pos: expression.pos ?? resolvePos('expression', expression.text),
    level: normalizeCefrLevel(expression.level),
    meaning: expression.intent ?? 'Workplace English expression.',
    context: expression.context ?? 'General',
    patterns: [],
    examples: expression.intent
      ? [{ label: 'Example', sentence: expression.text }]
      : [{ label: 'Example', sentence: expression.text }],
    alternatives: [],
    notes: [],
  };
}

export function getPracticeQuestions(
  situationId: string,
  options?: { preferItemIds?: string[]; questionCount?: number },
): PracticeQuestion[] {
  if (VOCABULARY_FORCE_LOCAL_SEED) {
    return getLocalPracticeQuestions(situationId, options);
  }
  return PRACTICE_BY_SITUATION[situationId] ?? DEFAULT_PRACTICE;
}

export function formatProgress(learned: number, total: number): string {
  return `${learned} / ${total}`;
}

export function isVocabularyLocalPackPreview(): boolean {
  return VOCABULARY_FORCE_LOCAL_SEED;
}
