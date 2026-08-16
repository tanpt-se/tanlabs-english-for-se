/** Shared builders for Lean Grammar v2 packs. */

export const LESSON_KEYS = ['form', 'use', 'apply'];

export function mc(lessonKey, n, prompt, options, correctIndex, explanation) {
  if (correctIndex < 0 || correctIndex >= options.length) {
    throw new Error(`MC ${lessonKey}-${n}: bad correctIndex`);
  }
  return {
    id: `${lessonKey}-${n}`,
    lessonKey,
    type: 'multiple_choice',
    prompt,
    explanation,
    payload: {
      options: options.map((label, index) => ({
        id: String.fromCharCode(97 + index),
        label,
      })),
    },
    answer: { optionId: String.fromCharCode(97 + correctIndex) },
  };
}

export function fill(lessonKey, n, template, accepted, explanation) {
  return {
    id: `${lessonKey}-${n}`,
    lessonKey,
    type: 'fill_blank',
    prompt: template,
    explanation,
    payload: { template },
    answer: { accepted: Array.isArray(accepted) ? accepted : [accepted] },
  };
}

export function so(lessonKey, n, sentence, explanation, prompt) {
  const punct = sentence.match(/[.?!]$/)?.[0] ?? '';
  const body = punct ? sentence.slice(0, -1) : sentence;
  const words = body.split(/\s+/).filter(Boolean);
  const tokens = words.map((text, index) => ({
    id: `t${index + 1}`,
    text: index === words.length - 1 && punct ? `${text}${punct}` : text,
  }));
  return {
    id: `${lessonKey}-${n}`,
    lessonKey,
    type: 'sentence_order',
    prompt: prompt ?? 'Build the workplace sentence.',
    explanation,
    payload: { tokens },
    answer: { tokenIds: tokens.map((token) => token.id) },
  };
}

export function lesson({
  key,
  level,
  title,
  description,
  usage,
  forms,
  exampleSentences,
  tips,
  exercises,
}) {
  return {
    key,
    level,
    title,
    description,
    usage,
    forms,
    exampleSentences,
    tips,
    exercises,
  };
}

export function topic({
  slug,
  title,
  description,
  sortOrder,
  categorySlug,
  isOptional = false,
  lessons,
}) {
  return {
    slug,
    title,
    description,
    sortOrder,
    categorySlug,
    curriculumVersion: 2,
    isOptional,
    lessons: lessons.map(({ exercises: _exercises, ...row }) => row),
    exercises: lessons.flatMap((row) =>
      row.exercises.map((exercise, index) => ({
        ...exercise,
        id: `${slug}-${exercise.id}`,
        sortHint: index,
      })),
    ),
  };
}
