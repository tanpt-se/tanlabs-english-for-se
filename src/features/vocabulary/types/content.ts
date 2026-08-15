/** Vocabulary P0 content + session types (PH3-01 / PH3-03). */

export const VOCABULARY_CONTENT_SCHEMA_VERSION = 1;
export const VOCABULARY_COMPLETION_THRESHOLD = 70;

export const VOCABULARY_LEVELS = ['A2', 'B1', 'B2', 'C1'] as const;
export type VocabularyLevel = (typeof VOCABULARY_LEVELS)[number];

export const VOCABULARY_SITUATION_SLUGS = [
  'daily-standup',
  'meetings',
  'task-progress',
  'bugs-problems',
  'client-communication',
] as const;
export type VocabularySituationSlug = (typeof VOCABULARY_SITUATION_SLUGS)[number];

export const VOCABULARY_ITEM_TYPES = ['word', 'phrase', 'expression'] as const;
export type VocabularyItemType = (typeof VOCABULARY_ITEM_TYPES)[number];

export const VOCABULARY_EXERCISE_TYPES = [
  'choose_expression',
  'fill_blank',
  'sentence_order',
] as const;
export type VocabularyExerciseType = (typeof VOCABULARY_EXERCISE_TYPES)[number];

export type VocabularyFeedback = {
  expression: string;
  meaning: string;
  context: string;
  example: string;
  explanation: string;
};

export type ChooseOption = { id: string; text: string };
export type ChooseExpressionExercise = {
  id: string;
  situationId: string;
  itemId: string | null;
  type: 'choose_expression';
  prompt: string;
  payload: { options: ChooseOption[] };
  answer: { optionId: string };
  feedback: VocabularyFeedback;
  sortOrder: number;
  contentSchemaVersion: number;
};

export type FillBlankExercise = {
  id: string;
  situationId: string;
  itemId: string | null;
  type: 'fill_blank';
  prompt: string;
  payload: { accepted: string[]; cue?: string };
  answer: { accepted: string[] };
  feedback: VocabularyFeedback;
  sortOrder: number;
  contentSchemaVersion: number;
};

export type SentenceToken = { id: string; text: string };
export type SentenceOrderExercise = {
  id: string;
  situationId: string;
  itemId: string | null;
  type: 'sentence_order';
  prompt: string;
  payload: { tokens: SentenceToken[] };
  answer: { tokenIds: string[] };
  feedback: VocabularyFeedback;
  sortOrder: number;
  contentSchemaVersion: number;
};

export type VocabularyExercise =
  | ChooseExpressionExercise
  | FillBlankExercise
  | SentenceOrderExercise;

export type PrivacyBoundedAnswerRecord = {
  exerciseId: string;
  correct: boolean;
  selectedIds?: string[];
  skipped?: boolean;
};

export type VocabularyItemOutcome = {
  itemId: string;
  correct: boolean;
  /** Owning situation id/slug — required when saving cross-situation weak practice. */
  situationId?: string;
};

export type CompletedVocabularySession = {
  clientAttemptId: string;
  situationId: string;
  situationSlug: string;
  contentRevision: number;
  correctCount: number;
  totalCount: number;
  score: number;
  completed: boolean;
  answers: PrivacyBoundedAnswerRecord[];
  itemResults: VocabularyItemOutcome[];
  startedAt: string;
  completedAt: string;
};

export function isVocabularyLevel(value: string): value is VocabularyLevel {
  return (VOCABULARY_LEVELS as readonly string[]).includes(value);
}

export function isVocabularyExerciseType(value: string): value is VocabularyExerciseType {
  return (VOCABULARY_EXERCISE_TYPES as readonly string[]).includes(value);
}
