import {
  EXERCISE_CONTENT_SCHEMA_VERSION,
  GRAMMAR_TOPIC_SLUGS,
  LESSON_CONTENT_SCHEMA_VERSION,
  type FillBlankExercise,
  type GrammarExercise,
  type GrammarLessonDefinition,
  type GrammarTopicDefinition,
  type GrammarTopicSlug,
  type LessonContent,
  type MultipleChoiceExercise,
  type SentenceOrderExercise,
} from '@/features/grammar/types/content';

const MAX_USAGE = 600;
const MAX_FORM = 240;
const MAX_TIP = 200;
const MAX_EXAMPLE_SENTENCE = 200;
const MAX_CONTEXT = 80;
const MIN_EXAMPLES = 5;
const MAX_EXAMPLES = 8;
const MAX_TIPS = 6;
const MAX_PROMPT = 280;
const MAX_EXPLANATION = 320;

export type ValidationResult = { ok: true } | { ok: false; error: string };

function isNonEmptyString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

export function isGrammarTopicSlug(value: string): value is GrammarTopicSlug {
  return (GRAMMAR_TOPIC_SLUGS as readonly string[]).includes(value);
}

export function validateLessonContent(content: LessonContent): ValidationResult {
  if (!isNonEmptyString(content.usage, MAX_USAGE)) {
    return { ok: false, error: 'Invalid usage' };
  }
  for (const key of ['affirmative', 'negative', 'question'] as const) {
    if (!isNonEmptyString(content.forms[key], MAX_FORM)) {
      return { ok: false, error: `Invalid form: ${key}` };
    }
  }
  if (content.examples.length < MIN_EXAMPLES || content.examples.length > MAX_EXAMPLES) {
    return { ok: false, error: 'examples count out of range' };
  }
  const ids = new Set<string>();
  for (const example of content.examples) {
    if (!isNonEmptyString(example.id, 64) || ids.has(example.id)) {
      return { ok: false, error: 'Invalid or duplicate example id' };
    }
    ids.add(example.id);
    if (
      !isNonEmptyString(example.context, MAX_CONTEXT) ||
      !isNonEmptyString(example.sentence, MAX_EXAMPLE_SENTENCE)
    ) {
      return { ok: false, error: 'Invalid example fields' };
    }
  }
  if (content.tips.length === 0 || content.tips.length > MAX_TIPS) {
    return { ok: false, error: 'tips count out of range' };
  }
  for (const tip of content.tips) {
    if (!isNonEmptyString(tip, MAX_TIP)) {
      return { ok: false, error: 'Invalid tip' };
    }
  }
  return { ok: true };
}

export function validateLessonDefinition(lesson: GrammarLessonDefinition): ValidationResult {
  if (!isGrammarTopicSlug(lesson.topicSlug)) {
    return { ok: false, error: 'Unknown topic slug' };
  }
  if (!isNonEmptyString(lesson.slug, 80) || !isNonEmptyString(lesson.summary, 240)) {
    return { ok: false, error: 'Invalid lesson meta' };
  }
  if (lesson.contentSchemaVersion !== LESSON_CONTENT_SCHEMA_VERSION) {
    return { ok: false, error: 'Unsupported lesson schema version' };
  }
  if (!Number.isInteger(lesson.contentRevision) || lesson.contentRevision < 1) {
    return { ok: false, error: 'Invalid content revision' };
  }
  return validateLessonContent(lesson.content);
}

function validateMc(exercise: MultipleChoiceExercise): ValidationResult {
  const { options } = exercise.payload;
  if (options.length < 2 || options.length > 6) {
    return { ok: false, error: 'MC option count out of range' };
  }
  const ids = new Set<string>();
  for (const option of options) {
    if (!isNonEmptyString(option.id, 64) || ids.has(option.id)) {
      return { ok: false, error: 'Invalid MC option id' };
    }
    ids.add(option.id);
    if (!isNonEmptyString(option.label, 160)) {
      return { ok: false, error: 'Invalid MC label' };
    }
  }
  if (!ids.has(exercise.answer.optionId)) {
    return { ok: false, error: 'MC answer not in options' };
  }
  return { ok: true };
}

function validateFill(exercise: FillBlankExercise): ValidationResult {
  if (
    !isNonEmptyString(exercise.payload.template, 280) ||
    !exercise.payload.template.includes('___')
  ) {
    return { ok: false, error: 'Invalid fill template' };
  }
  if (exercise.answer.accepted.length < 1 || exercise.answer.accepted.length > 8) {
    return { ok: false, error: 'accepted answers out of range' };
  }
  for (const item of exercise.answer.accepted) {
    if (!isNonEmptyString(item, 80)) {
      return { ok: false, error: 'Invalid accepted answer' };
    }
  }
  return { ok: true };
}

function validateOrder(exercise: SentenceOrderExercise): ValidationResult {
  const { tokens } = exercise.payload;
  if (tokens.length < 2 || tokens.length > 12) {
    return { ok: false, error: 'token count out of range' };
  }
  const ids = new Set<string>();
  for (const token of tokens) {
    if (!isNonEmptyString(token.id, 64) || ids.has(token.id)) {
      return { ok: false, error: 'Invalid token id' };
    }
    ids.add(token.id);
    if (!isNonEmptyString(token.text, 40)) {
      return { ok: false, error: 'Invalid token text' };
    }
  }
  if (exercise.answer.tokenIds.length !== tokens.length) {
    return { ok: false, error: 'tokenIds length mismatch' };
  }
  for (const id of exercise.answer.tokenIds) {
    if (!ids.has(id)) {
      return { ok: false, error: 'Unknown token id in answer' };
    }
  }
  return { ok: true };
}

export function validateExercise(exercise: GrammarExercise): ValidationResult {
  if (!isGrammarTopicSlug(exercise.topicSlug)) {
    return { ok: false, error: 'Unknown topic slug' };
  }
  if (
    !isNonEmptyString(exercise.id, 80) ||
    !isNonEmptyString(exercise.lessonSlug, 80) ||
    !isNonEmptyString(exercise.prompt, MAX_PROMPT) ||
    !isNonEmptyString(exercise.explanation, MAX_EXPLANATION)
  ) {
    return { ok: false, error: 'Invalid exercise meta' };
  }
  if (exercise.contentSchemaVersion !== EXERCISE_CONTENT_SCHEMA_VERSION) {
    return { ok: false, error: 'Unsupported exercise schema version' };
  }
  switch (exercise.type) {
    case 'multiple_choice':
      return validateMc(exercise);
    case 'fill_blank':
      return validateFill(exercise);
    case 'sentence_order':
      return validateOrder(exercise);
    default:
      return { ok: false, error: 'Unknown exercise type' };
  }
}

export function validateTopicDefinition(topic: GrammarTopicDefinition): ValidationResult {
  if (!isGrammarTopicSlug(topic.slug)) {
    return { ok: false, error: 'Unknown topic slug' };
  }
  if (
    !isNonEmptyString(topic.title, 80) ||
    !isNonEmptyString(topic.description, 240) ||
    !['A2', 'B1', 'B2'].includes(topic.level)
  ) {
    return { ok: false, error: 'Invalid topic meta' };
  }
  return { ok: true };
}
