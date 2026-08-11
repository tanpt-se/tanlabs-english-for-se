/** PH2 content contract — schema version for lesson JSONB. */
export const LESSON_CONTENT_SCHEMA_VERSION = 1;

/** PH2 content contract — schema version for exercise payload/answer. */
export const EXERCISE_CONTENT_SCHEMA_VERSION = 1;

/** Completion threshold: score >= 70 → completed. */
export const GRAMMAR_COMPLETION_THRESHOLD = 70;

export const GRAMMAR_TOPIC_SLUGS = [
  'present-simple',
  'present-continuous',
  'past-simple',
  'present-perfect',
  'future-forms',
] as const;

export type GrammarTopicSlug = (typeof GRAMMAR_TOPIC_SLUGS)[number];

export type GrammarTopicDefinition = {
  slug: GrammarTopicSlug;
  title: string;
  description: string;
  level: 'A2' | 'B1' | 'B2';
  sortOrder: number;
};

export type LessonExample = {
  id: string;
  context: string;
  sentence: string;
};

export type LessonContent = {
  usage: string;
  forms: {
    affirmative: string;
    negative: string;
    question: string;
  };
  examples: LessonExample[];
  tips: string[];
};

export type MultipleChoiceOption = {
  id: string;
  label: string;
};

export type MultipleChoicePayload = {
  options: MultipleChoiceOption[];
};

export type MultipleChoiceAnswer = {
  optionId: string;
};

export type FillBlankPayload = {
  /** Template with a single `___` blank. */
  template: string;
};

export type FillBlankAnswer = {
  accepted: string[];
};

export type SentenceToken = {
  id: string;
  text: string;
};

export type SentenceOrderPayload = {
  tokens: SentenceToken[];
};

export type SentenceOrderAnswer = {
  tokenIds: string[];
};

export type GrammarExerciseType = 'multiple_choice' | 'fill_blank' | 'sentence_order';

export type GrammarExerciseBase = {
  id: string;
  topicSlug: GrammarTopicSlug;
  lessonSlug: string;
  type: GrammarExerciseType;
  prompt: string;
  explanation: string;
  sortOrder: number;
  contentSchemaVersion: number;
};

export type MultipleChoiceExercise = GrammarExerciseBase & {
  type: 'multiple_choice';
  payload: MultipleChoicePayload;
  answer: MultipleChoiceAnswer;
};

export type FillBlankExercise = GrammarExerciseBase & {
  type: 'fill_blank';
  payload: FillBlankPayload;
  answer: FillBlankAnswer;
};

export type SentenceOrderExercise = GrammarExerciseBase & {
  type: 'sentence_order';
  payload: SentenceOrderPayload;
  answer: SentenceOrderAnswer;
};

export type GrammarExercise = MultipleChoiceExercise | FillBlankExercise | SentenceOrderExercise;

export type GrammarLessonDefinition = {
  topicSlug: GrammarTopicSlug;
  slug: string;
  summary: string;
  content: LessonContent;
  contentSchemaVersion: number;
  contentRevision: number;
  sortOrder: number;
};

/** Privacy-bounded persisted answer (no raw fill-blank text). */
export type PrivacyBoundedAnswerRecord = {
  exerciseId: string;
  correct: boolean;
  /** Stable option/token IDs when applicable. */
  selectedIds?: string[];
};

export type CompletedPracticeSession = {
  clientAttemptId: string;
  topicId: string;
  lessonId: string;
  contentRevision: number;
  correctCount: number;
  totalCount: number;
  score: number;
  completed: boolean;
  answers: PrivacyBoundedAnswerRecord[];
  startedAt: string;
  completedAt: string;
};
