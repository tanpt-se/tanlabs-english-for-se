#!/usr/bin/env node
/**
 * Merge curated sources → supabase/seed/vocabulary/packs.json
 * Usage: pnpm run vocabulary:packs:generate
 *
 * Dedupes globally by normalized term. Cross-cutting items are assigned to the
 * thinnest core situation after core packs load (round-robin by load).
 * Caps at TARGET unique terms (default 2500) for the locked ship band.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  attachExercisesToSituationItems,
  summarizeExercises,
} from './lib/vocabulary-exercises.mjs';

const ROOT = process.cwd();
const SOURCES_DIR = resolve(ROOT, 'supabase/seed/vocabulary/sources');
const PACKS_PATH = resolve(ROOT, 'supabase/seed/vocabulary/packs.json');
const LEXICON_PATH = resolve(ROOT, 'supabase/seed/vocabulary/lexicon.json');

const TARGET = Number(process.env.VOCABULARY_PACK_TARGET || 2500);
const TARGET_MIN = 2000;
const TARGET_MAX = 3000;

const SITUATIONS = [
  {
    slug: 'daily-standup',
    title: 'Daily Standup',
    description: 'Updates, blockers, priorities',
    sortOrder: 1,
    source: 'daily-standup.json',
  },
  {
    slug: 'meetings',
    title: 'Meetings',
    description: 'Agree, challenge, decide',
    sortOrder: 2,
    source: 'meetings.json',
  },
  {
    slug: 'task-progress',
    title: 'Task & Progress',
    description: 'Status, ownership, next steps',
    sortOrder: 3,
    source: 'task-progress.json',
  },
  {
    slug: 'bugs-problems',
    title: 'Bugs & Problems',
    description: 'Diagnose, explain, propose',
    sortOrder: 4,
    source: 'bugs-problems.json',
  },
  {
    slug: 'client-communication',
    title: 'Client Communication',
    description: 'Clarify, align, follow up',
    sortOrder: 5,
    source: 'client-communication.json',
  },
];

function normalizeTerm(term) {
  return String(term)
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function slugKey(term, used) {
  let base = String(term)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  if (!base) base = 'item';
  let key = base;
  let n = 2;
  while (used.has(key)) {
    key = `${base}-${n}`;
    n += 1;
  }
  used.add(key);
  return key;
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const PHRASAL_VERB_STARTERS =
  /^(catch|check|follow|get|give|look|put|roll|run|set|sign|take|turn|bring|come|go|break|call|fill|hand|pick|scale|ship|stand|wrap)\s+/i;

/** Cambridge-style short POS; prefer authored `pos`, else infer from type/term. */
function inferPos(type, term) {
  if (type === 'expression') return 'expr';
  if (type === 'phrase') return PHRASAL_VERB_STARTERS.test(term) ? 'phr v' : 'phr';
  const lemma = String(term).trim().toLowerCase();
  if (/ly$/i.test(lemma) && lemma.length > 4) return 'adv';
  return 'n';
}

function toItem(raw, sortOrder, usedKeys) {
  const examples = Array.isArray(raw.example) ? [raw.example] : raw.examples ?? [];
  const pos =
    typeof raw.pos === 'string' && raw.pos.trim()
      ? raw.pos.trim().toLowerCase()
      : inferPos(raw.type, raw.term);
  return {
    key: slugKey(raw.term, usedKeys),
    type: raw.type,
    term: raw.term,
    meaning: raw.meaning,
    context: raw.context,
    level: raw.level,
    pos,
    sortOrder,
    patterns: raw.patterns ?? [],
    examples,
    alternatives: raw.alternatives ?? [],
    notes: raw.notes ?? [],
    exercises: raw.exercises ?? [],
  };
}

function main() {
  if (TARGET < TARGET_MIN || TARGET > TARGET_MAX) {
    console.error(`TARGET ${TARGET} outside ship band [${TARGET_MIN}, ${TARGET_MAX}]`);
    process.exit(1);
  }

  const seen = new Map();
  /** @type {Map<string, object[]>} */
  const bySituation = new Map(SITUATIONS.map((s) => [s.slug, []]));

  let skippedDup = 0;
  let skippedInvalid = 0;

  for (const sit of SITUATIONS) {
    const path = resolve(SOURCES_DIR, sit.source);
    const rows = loadJson(path);
    if (!Array.isArray(rows)) {
      console.error(`${sit.source} must be an array`);
      process.exit(1);
    }
    for (const raw of rows) {
      if (!raw?.term || !raw?.type || !raw?.meaning || !raw?.context || !raw?.level) {
        skippedInvalid += 1;
        continue;
      }
      const norm = normalizeTerm(raw.term);
      if (seen.has(norm)) {
        skippedDup += 1;
        continue;
      }
      seen.set(norm, sit.slug);
      bySituation.get(sit.slug).push(raw);
    }
  }

  const crossPath = resolve(SOURCES_DIR, 'cross-cutting.json');
  const crossRows = loadJson(crossPath);
  const crossAccepted = [];
  for (const raw of crossRows) {
    if (!raw?.term || !raw?.type || !raw?.meaning || !raw?.context || !raw?.level) {
      skippedInvalid += 1;
      continue;
    }
    const norm = normalizeTerm(raw.term);
    if (seen.has(norm)) {
      skippedDup += 1;
      continue;
    }
    crossAccepted.push(raw);
  }

  // Assign cross-cutting to thinnest situations until TARGET.
  let total = [...bySituation.values()].reduce((n, rows) => n + rows.length, 0);
  for (const raw of crossAccepted) {
    if (total >= TARGET) break;
    const sorted = [...bySituation.entries()].sort((a, b) => a[1].length - b[1].length);
    const slug = sorted[0][0];
    const norm = normalizeTerm(raw.term);
    seen.set(norm, slug);
    bySituation.get(slug).push(raw);
    total += 1;
  }

  // If still over TARGET (core alone), trim from largest situations (prefer keep expressions+phrases diversity by cutting from end).
  if (total > TARGET) {
    while (total > TARGET) {
      const sorted = [...bySituation.entries()].sort((a, b) => b[1].length - a[1].length);
      const [slug, rows] = sorted[0];
      if (rows.length <= 1) break;
      rows.pop();
      total -= 1;
      bySituation.set(slug, rows);
    }
  }

  // If under TARGET after all sources, warn (ship audit will fail).
  const packs = {
    contentSchemaVersion: 1,
    situations: SITUATIONS.map((sit) => {
      const usedKeys = new Set();
      const baseItems = bySituation
        .get(sit.slug)
        .map((raw, index) => toItem(raw, index + 1, usedKeys));
      const items = attachExercisesToSituationItems(baseItems);
      return {
        slug: sit.slug,
        title: sit.title,
        description: sit.description,
        sortOrder: sit.sortOrder,
        items,
      };
    }),
  };

  writeFileSync(PACKS_PATH, `${JSON.stringify(packs, null, 2)}\n`, 'utf8');

  // Expand lexicon tokens from terms (words/phrases) for future quality gates.
  const lexicon = loadJson(LEXICON_PATH);
  const tokenSet = new Set((lexicon.tokens ?? []).map((t) => String(t).toLowerCase()));
  for (const sit of packs.situations) {
    for (const item of sit.items) {
      if (item.type === 'word' || item.type === 'phrase') {
        tokenSet.add(normalizeTerm(item.term));
      }
    }
  }
  lexicon.tokens = [...tokenSet].sort();
  writeFileSync(LEXICON_PATH, `${JSON.stringify(lexicon, null, 2)}\n`, 'utf8');

  const unique = packs.situations.reduce((n, s) => n + s.items.length, 0);
  const exerciseSummary = summarizeExercises(packs.situations);
  console.log(
    JSON.stringify(
      {
        unique,
        target: TARGET,
        skippedDup,
        skippedInvalid,
        exercises: exerciseSummary,
        perSituation: Object.fromEntries(packs.situations.map((s) => [s.slug, s.items.length])),
        sources: readdirSync(SOURCES_DIR).filter((f) => f.endsWith('.json')),
      },
      null,
      2,
    ),
  );
}

main();
