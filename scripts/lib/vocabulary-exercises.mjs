/**
 * Deterministic P0 exercise builders for vocabulary packs.
 * Types: choose_expression | fill_blank | sentence_order
 */

const OPTION_IDS = ['opt_a', 'opt_b', 'opt_c', 'opt_d'];

function shuffleDeterministic(items, seed) {
  const next = [...items];
  let state = seed >>> 0;
  for (let i = next.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
}

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function exampleSentence(item) {
  const pair = item.examples?.[0];
  if (Array.isArray(pair) && typeof pair[1] === 'string' && pair[1].trim()) {
    return pair[1].trim();
  }
  return null;
}

function feedbackFor(item) {
  const example = exampleSentence(item) ?? `Use “${item.term}” in ${item.context}.`;
  return {
    expression: item.term,
    meaning: item.meaning,
    context: item.context,
    example,
    explanation: `“${item.term}” fits this workplace ${item.context.toLowerCase()} context.`,
  };
}

function pickDistractors(item, pool, count, seed) {
  const others = pool.filter((candidate) => candidate.key !== item.key);
  return shuffleDeterministic(others, seed).slice(0, count);
}

export function buildChooseExpression(item, pool, sortIndex) {
  const seed = hashSeed(`ce:${item.key}`);
  const distractors = pickDistractors(item, pool, 3, seed);
  while (distractors.length < 3) {
    distractors.push({
      key: `pad-${distractors.length}`,
      term: `Option ${distractors.length + 1}`,
    });
  }
  const texts = shuffleDeterministic(
    [item.term, ...distractors.map((d) => d.term)],
    seed ^ 0x9e3779b9,
  );
  const options = texts.map((text, index) => ({
    id: OPTION_IDS[index],
    text,
  }));
  const correct = options.find((option) => option.text === item.term) ?? options[0];
  return {
    key: `ce-${item.key}`,
    type: 'choose_expression',
    prompt: item.meaning,
    payload: {
      options,
      correctOptionId: correct.id,
    },
    feedback: feedbackFor(item),
    sortOrder: sortIndex,
  };
}

function blankSentence(item) {
  const sentence = exampleSentence(item);
  if (sentence) {
    const escaped = item.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'i');
    if (re.test(sentence)) {
      return sentence.replace(re, '___');
    }
  }
  return `In ${item.context}, write the term for: ${item.meaning} (___)`;
}

export function buildFillBlank(item, sortIndex) {
  const term = String(item.term).trim();
  const accepted = Array.from(
    new Set([term, term.toLowerCase(), term[0] ? term[0].toUpperCase() + term.slice(1) : term]),
  ).filter(Boolean);
  return {
    key: `fb-${item.key}`,
    type: 'fill_blank',
    prompt: blankSentence(item),
    payload: {
      accepted,
      cue: item.type === 'word' ? term : undefined,
    },
    feedback: feedbackFor(item),
    sortOrder: sortIndex,
  };
}

function tokenizeForOrder(text) {
  const cleaned = String(text).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();
  if (!cleaned) return [];
  // Keep trailing punctuation on the last token when present.
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return parts;
}

export function buildSentenceOrder(item, sortIndex) {
  const source =
    item.type === 'expression'
      ? item.term
      : exampleSentence(item) ?? `${item.term} is useful in ${item.context}.`;
  let tokens = tokenizeForOrder(source);
  if (tokens.length < 3) {
    tokens = tokenizeForOrder(`Use ${item.term} in this ${item.context} update.`);
  }
  if (tokens.length < 3) {
    return null;
  }
  const payloadTokens = tokens.map((text, index) => ({
    id: `t${index + 1}`,
    text,
  }));
  return {
    key: `so-${item.key}`,
    type: 'sentence_order',
    prompt: 'Put the words in the correct order.',
    payload: {
      tokens: payloadTokens,
      correctOrder: payloadTokens.map((token) => token.id),
    },
    feedback: feedbackFor(item),
    sortOrder: sortIndex,
  };
}

/**
 * Attach one primary exercise per item (cycle types) so each situation
 * can compose an 8–12 / 5/3/2 session from inventory.
 */
export function attachExercisesToSituationItems(items) {
  return items.map((item, index) => {
    if (Array.isArray(item.exercises) && item.exercises.length > 0) {
      return item;
    }
    const lane = index % 3;
    /** @type {object[]} */
    let exercises = [];
    if (lane === 0) {
      exercises = [buildChooseExpression(item, items, 1)];
    } else if (lane === 1) {
      exercises = [buildFillBlank(item, 1)];
    } else {
      const ordered = buildSentenceOrder(item, 1);
      exercises = [ordered ?? buildChooseExpression(item, items, 1)];
    }
    return { ...item, exercises };
  });
}

export function summarizeExercises(situations) {
  const counts = { choose_expression: 0, fill_blank: 0, sentence_order: 0 };
  let total = 0;
  for (const situation of situations) {
    for (const item of situation.items ?? []) {
      for (const exercise of item.exercises ?? []) {
        total += 1;
        if (counts[exercise.type] != null) {
          counts[exercise.type] += 1;
        }
      }
    }
  }
  return { total, ...counts };
}
