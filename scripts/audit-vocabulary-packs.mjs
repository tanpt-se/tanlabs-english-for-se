#!/usr/bin/env node
/**
 * Fail-closed authoring audit for supabase/seed/vocabulary/packs.json.
 * Usage:
 *   pnpm run vocabulary:audit
 *   pnpm run vocabulary:audit:ship   # enforces unique count in [2000, 3000]
 *
 * Spec: supabase/seed/vocabulary/AUTHORING.md
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const PACKS_PATH = resolve(ROOT, 'supabase/seed/vocabulary/packs.json');
const LEXICON_PATH = resolve(ROOT, 'supabase/seed/vocabulary/lexicon.json');

const SHIP_MIN = 2000;
const SHIP_MAX = 3000;
const enforceShipCount =
  process.argv.includes('--ship') || process.env.VOCABULARY_AUDIT_SHIP === '1';

const CORE_SLUGS = [
  'daily-standup',
  'meetings',
  'task-progress',
  'bugs-problems',
  'client-communication',
];

const ITEM_TYPES = new Set(['word', 'phrase', 'expression']);
const LEVELS = new Set(['A2', 'B1', 'B2', 'C1']);
const EXERCISE_TYPES = new Set(['choose_expression', 'fill_blank', 'sentence_order']);

const LIMITS = {
  title: 80,
  description: 140,
  term: 160,
  meaning: 160,
  context: 40,
  pattern: 120,
  note: 160,
  alternative: 120,
  exampleSentence: 220,
  patterns: 8,
  examples: 6,
  alternatives: 6,
  notes: 4,
};

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function normalizeTerm(term) {
  return String(term)
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertMaxLen(label, value, max) {
  if (typeof value === 'string' && value.length > max) {
    fail(`${label} exceeds ${max} chars (${value.length})`);
  }
}

function main() {
  const packs = readJson(PACKS_PATH);
  const lexicon = readJson(LEXICON_PATH);
  const contexts = new Set(lexicon.contexts ?? []);
  const forbidden = (lexicon.forbidden ?? []).map((s) => String(s).toLowerCase());

  if (packs.contentSchemaVersion !== 1) {
    fail(`contentSchemaVersion must be 1 (got ${packs.contentSchemaVersion})`);
  }

  if (!Array.isArray(packs.situations) || packs.situations.length === 0) {
    fail('situations[] must be a non-empty array');
    reportAndExit(0);
    return;
  }

  const seenSituationSlugs = new Set();
  const seenNormalizedTerms = new Map();
  let itemCount = 0;
  let exerciseCount = 0;

  for (const situation of packs.situations) {
    const sitLabel = `situation:${situation?.slug ?? '?'}`;
    if (!isNonEmptyString(situation.slug)) {
      fail(`${sitLabel}: missing slug`);
      continue;
    }
    if (seenSituationSlugs.has(situation.slug)) {
      fail(`duplicate situation slug: ${situation.slug}`);
    }
    seenSituationSlugs.add(situation.slug);

    assertMaxLen(`${sitLabel}.title`, situation.title, LIMITS.title);
    assertMaxLen(`${sitLabel}.description`, situation.description, LIMITS.description);
    if (!isNonEmptyString(situation.title) || !isNonEmptyString(situation.description)) {
      fail(`${sitLabel}: title and description are required`);
    }
    if (typeof situation.sortOrder !== 'number') {
      fail(`${sitLabel}: sortOrder must be a number`);
    }
    if (!Array.isArray(situation.items)) {
      fail(`${sitLabel}: items[] required`);
      continue;
    }

    const seenKeys = new Set();
    for (const item of situation.items) {
      itemCount += 1;
      const itemLabel = `${sitLabel}/item:${item?.key ?? '?'}`;
      if (!isNonEmptyString(item.key)) {
        fail(`${itemLabel}: missing key`);
        continue;
      }
      if (seenKeys.has(item.key)) {
        fail(`${sitLabel}: duplicate item key ${item.key}`);
      }
      seenKeys.add(item.key);

      if (!ITEM_TYPES.has(item.type)) {
        fail(`${itemLabel}: type must be word|phrase|expression`);
      }
      if (!LEVELS.has(item.level)) {
        fail(`${itemLabel}: level must be A2|B1|B2|C1`);
      }
      if (!isNonEmptyString(item.term) || !isNonEmptyString(item.meaning)) {
        fail(`${itemLabel}: term and meaning are required`);
      }
      assertMaxLen(`${itemLabel}.term`, item.term, LIMITS.term);
      assertMaxLen(`${itemLabel}.meaning`, item.meaning, LIMITS.meaning);
      assertMaxLen(`${itemLabel}.context`, item.context, LIMITS.context);

      if (!contexts.has(item.context)) {
        fail(`${itemLabel}: context "${item.context}" not in lexicon.contexts`);
      }

      const normalized = normalizeTerm(item.term);
      if (!normalized) {
        fail(`${itemLabel}: term normalizes to empty`);
      } else if (seenNormalizedTerms.has(normalized)) {
        fail(
          `duplicate term "${
            item.term
          }" (normalized "${normalized}"); also at ${seenNormalizedTerms.get(normalized)}`,
        );
      } else {
        seenNormalizedTerms.set(normalized, itemLabel);
      }

      const haystack = [
        item.term,
        item.meaning,
        ...(item.patterns ?? []),
        ...(item.notes ?? []),
        ...(item.alternatives ?? []),
        ...((item.examples ?? []).flat?.() ?? []),
      ]
        .join(' ')
        .toLowerCase();
      for (const bad of forbidden) {
        if (!bad) continue;
        const escaped = bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
        if (re.test(` ${haystack} `)) {
          fail(`${itemLabel}: forbidden phrase "${bad}"`);
        }
      }

      for (const field of ['patterns', 'examples', 'alternatives', 'notes', 'exercises']) {
        if (item[field] != null && !Array.isArray(item[field])) {
          fail(`${itemLabel}: ${field} must be an array`);
        }
      }
      if ((item.patterns ?? []).length > LIMITS.patterns) {
        fail(`${itemLabel}: patterns exceeds ${LIMITS.patterns}`);
      }
      if ((item.examples ?? []).length > LIMITS.examples) {
        fail(`${itemLabel}: examples exceeds ${LIMITS.examples}`);
      }
      if ((item.alternatives ?? []).length > LIMITS.alternatives) {
        fail(`${itemLabel}: alternatives exceeds ${LIMITS.alternatives}`);
      }
      if ((item.notes ?? []).length > LIMITS.notes) {
        fail(`${itemLabel}: notes exceeds ${LIMITS.notes}`);
      }

      for (const [i, pattern] of (item.patterns ?? []).entries()) {
        assertMaxLen(`${itemLabel}.patterns[${i}]`, pattern, LIMITS.pattern);
      }
      for (const [i, note] of (item.notes ?? []).entries()) {
        assertMaxLen(`${itemLabel}.notes[${i}]`, note, LIMITS.note);
      }
      for (const [i, alt] of (item.alternatives ?? []).entries()) {
        assertMaxLen(`${itemLabel}.alternatives[${i}]`, alt, LIMITS.alternative);
      }
      for (const [i, example] of (item.examples ?? []).entries()) {
        if (!Array.isArray(example) || example.length !== 2) {
          fail(`${itemLabel}.examples[${i}]: must be [context, sentence]`);
          continue;
        }
        const [exContext, sentence] = example;
        if (!contexts.has(exContext)) {
          fail(`${itemLabel}.examples[${i}]: context "${exContext}" not in lexicon`);
        }
        assertMaxLen(`${itemLabel}.examples[${i}].sentence`, sentence, LIMITS.exampleSentence);
      }

      for (const [i, exercise] of (item.exercises ?? []).entries()) {
        exerciseCount += 1;
        const exLabel = `${itemLabel}/exercise[${i}]`;
        if (!EXERCISE_TYPES.has(exercise?.type)) {
          fail(`${exLabel}: type must be choose_expression|fill_blank|sentence_order`);
          continue;
        }
        if (!isNonEmptyString(exercise?.prompt)) {
          fail(`${exLabel}: prompt required`);
        }
        if (!isNonEmptyString(exercise?.key)) {
          fail(`${exLabel}: key required`);
        }
        const feedback = exercise?.feedback;
        if (!feedback || typeof feedback !== 'object') {
          fail(`${exLabel}: feedback object required`);
        } else {
          for (const field of ['expression', 'meaning', 'context', 'example', 'explanation']) {
            if (!isNonEmptyString(feedback[field])) {
              fail(`${exLabel}: feedback.${field} required`);
            }
          }
        }
        const payload = exercise?.payload;
        if (!payload || typeof payload !== 'object') {
          fail(`${exLabel}: payload object required`);
          continue;
        }
        if (exercise.type === 'choose_expression') {
          if (!Array.isArray(payload.options) || payload.options.length !== 4) {
            fail(`${exLabel}: choose_expression needs exactly 4 options`);
          } else {
            const ids = new Set();
            for (const option of payload.options) {
              if (!isNonEmptyString(option?.id) || !isNonEmptyString(option?.text)) {
                fail(`${exLabel}: option id/text required`);
              }
              ids.add(option.id);
            }
            if (!ids.has(payload.correctOptionId)) {
              fail(`${exLabel}: correctOptionId must match an option`);
            }
          }
        }
        if (exercise.type === 'fill_blank') {
          if (!String(exercise.prompt).includes('___')) {
            fail(`${exLabel}: fill_blank prompt must include ___`);
          }
          if (!Array.isArray(payload.accepted) || payload.accepted.length < 1) {
            fail(`${exLabel}: fill_blank accepted[] required`);
          }
        }
        if (exercise.type === 'sentence_order') {
          if (!Array.isArray(payload.tokens) || payload.tokens.length < 3) {
            fail(`${exLabel}: sentence_order needs >=3 tokens`);
          }
          if (!Array.isArray(payload.correctOrder) || payload.correctOrder.length < 3) {
            fail(`${exLabel}: sentence_order correctOrder required`);
          }
        }
      }

      if (enforceShipCount && (!item.exercises || item.exercises.length < 1)) {
        fail(`${itemLabel}: ship gate requires >=1 exercise`);
      }
    }
  }

  for (const slug of CORE_SLUGS) {
    if (!seenSituationSlugs.has(slug)) {
      fail(`missing core situation slug: ${slug}`);
    }
  }

  const uniqueCount = seenNormalizedTerms.size;
  if (uniqueCount < SHIP_MIN) {
    warn(
      `unique terms ${uniqueCount} < ship floor ${SHIP_MIN} (scaffold OK; use --ship when ready)`,
    );
  } else if (uniqueCount > SHIP_MAX) {
    fail(`unique terms ${uniqueCount} exceeds ship ceiling ${SHIP_MAX}`);
  }

  if (enforceShipCount) {
    if (uniqueCount < SHIP_MIN || uniqueCount > SHIP_MAX) {
      fail(
        `ship count gate: unique terms must be in [${SHIP_MIN}, ${SHIP_MAX}] (got ${uniqueCount})`,
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        situations: seenSituationSlugs.size,
        items: itemCount,
        uniqueTerms: uniqueCount,
        exercises: exerciseCount,
        shipBand: [SHIP_MIN, SHIP_MAX],
        enforceShipCount,
      },
      null,
      2,
    ),
  );

  reportAndExit(uniqueCount);
}

function reportAndExit(uniqueCount) {
  for (const message of warnings) {
    console.warn(`WARN ${message}`);
  }
  if (errors.length > 0) {
    for (const message of errors) {
      console.error(`ERROR ${message}`);
    }
    console.error(`vocabulary audit failed (${errors.length} error(s); unique=${uniqueCount})`);
    process.exit(1);
  }
  console.log(`vocabulary audit passed (unique=${uniqueCount})`);
}

main();
