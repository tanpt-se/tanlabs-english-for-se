export const LESSON_CONTENT_SCHEMA_VERSION = 1;

export const EXERCISE_CONTENT_SCHEMA_VERSION = 1;

export const GRAMMAR_COMPLETION_THRESHOLD = 70;

export const GRAMMAR_CURRICULUM_VERSION = 2;

export const GRAMMAR_LEVELS = ['A2', 'B1', 'B2', 'C1'] as const;
export type GrammarLevel = (typeof GRAMMAR_LEVELS)[number];

export const GRAMMAR_CATEGORY_SLUGS = [
  'core-tenses',
  'timeline-planning',
  'sentence-structure',
  'workplace-communication',
] as const;
export type GrammarCategorySlug = (typeof GRAMMAR_CATEGORY_SLUGS)[number];

export const GRAMMAR_CATEGORY_TITLES: Record<GrammarCategorySlug, string> = {
  'core-tenses': 'Core Tenses',
  'timeline-planning': 'Timeline & Planning',
  'sentence-structure': 'Sentence Structure',
  'workplace-communication': 'Workplace Communication',
};

export const GRAMMAR_CATEGORY_BLURBS: Record<GrammarCategorySlug, string> = {
  'core-tenses': 'Daily essentials',
  'timeline-planning': 'Optional path',
  'sentence-structure': 'Clear writing',
  'workplace-communication': 'Requests and tone',
};

export const GRAMMAR_TOPIC_SLUGS = [
  'present-simple',
  'present-continuous',
  'past-simple',
  'past-continuous',
  'present-perfect',
  'future-forms',
  'progress-earlier-past',
  'future-milestones',
  'clear-sentence-building',
  'passive-relative',
  'requests-questions-modals',
  'conditions-reporting-tone',
] as const;
export type GrammarTopicSlug = (typeof GRAMMAR_TOPIC_SLUGS)[number];

export const GRAMMAR_OPTIONAL_TOPIC_SLUGS = ['progress-earlier-past', 'future-milestones'] as const;
export type GrammarOptionalTopicSlug = (typeof GRAMMAR_OPTIONAL_TOPIC_SLUGS)[number];

export const GRAMMAR_TOPIC_CATEGORY: Record<GrammarTopicSlug, GrammarCategorySlug> = {
  'present-simple': 'core-tenses',
  'present-continuous': 'core-tenses',
  'past-simple': 'core-tenses',
  'past-continuous': 'core-tenses',
  'present-perfect': 'core-tenses',
  'future-forms': 'core-tenses',
  'progress-earlier-past': 'timeline-planning',
  'future-milestones': 'timeline-planning',
  'clear-sentence-building': 'sentence-structure',
  'passive-relative': 'sentence-structure',
  'requests-questions-modals': 'workplace-communication',
  'conditions-reporting-tone': 'workplace-communication',
};

/** Unpublished v1 slugs (progress/attempts may still reference those rows). */
export const GRAMMAR_V1_TOPIC_SLUGS = [
  'present-simple',
  'present-continuous',
  'past-simple',
  'present-perfect',
  'future-forms',
  'modals',
  'conditionals',
  'passives',
  'articles',
  'reported-speech',
  'present-perfect-continuous',
  'verb-patterns',
  'connectors',
] as const;

/** @deprecated Use GRAMMAR_TOPIC_SLUGS — kept as alias for the topic slug list. */
export const GRAMMAR_TENSE_SLUGS = GRAMMAR_TOPIC_SLUGS;
export type GrammarTenseSlug = GrammarTopicSlug;

export type GrammarTopicDefinition = {
  slug: GrammarTopicSlug;
  title: string;
  description: string;
  sortOrder: number;
  categorySlug: GrammarCategorySlug;
  curriculumVersion: number;
  isOptional: boolean;
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
  title: string;
  description: string;
  level: GrammarLevel;
  content: LessonContent;
  contentSchemaVersion: number;
  contentRevision: number;
  sortOrder: number;
};

export type PrivacyBoundedAnswerRecord = {
  exerciseId: string;
  correct: boolean;
  selectedIds?: string[];
  skipped?: boolean;
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

export function isGrammarLevel(value: string): value is GrammarLevel {
  return (GRAMMAR_LEVELS as readonly string[]).includes(value);
}
