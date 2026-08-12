#!/usr/bin/env node
/**
 * Per-topic workplace scorecard for packs.json.
 * Usage: pnpm run grammar:score
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { auditGrammarJobFit } from './audit-grammar-quality.mjs';

const ROOT = process.cwd();
const PACKS_PATH = resolve(ROOT, 'supabase/seed/grammar/packs.json');

const DISCOURSE = [
  { id: 'request', re: /\b(could you|can you|please|would you)\b/i },
  { id: 'status', re: /\b(right now|at the moment|currently|so far|still|status)\b/i },
  { id: 'hedge', re: /\b(might|may |could be|seems|hypothesis|unmeasured)\b/i },
  { id: 'decision', re: /\b(okay[, —-]|i will|we'll|going to)\b/i },
  { id: 'advise', re: /\b(should|must|need to|have to)\b/i },
];

function normalizePrompt(prompt) {
  return String(prompt ?? '')
    .toLowerCase()
    .replace(/___+/g, '___')
    .replace(/\s+/g, ' ')
    .trim();
}

function grade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function scoreTopic(pack) {
  const notes = [];
  let score = 100;

  const b1Mc = pack.exercises.filter(
    (exercise) => exercise.lessonKey === 'b1' && exercise.type === 'multiple_choice',
  );
  const pickish = b1Mc.filter((exercise) => {
    const labels = (exercise.payload?.options ?? []).map((option) => option.label);
    const blob = labels.join(' ');
    const families = [
      /\b(am|is|are)\s+\w+ing\b/i.test(blob),
      /\b(have|has|haven't|hasn't)\b/i.test(blob),
      /\b(will|won't|going to)\b/i.test(blob),
      /\b(did|didn't|was|were|\w+ed)\b/i.test(blob),
      /^(a|an|the)\b/i.test(labels[0] ?? '') ||
        labels.some((label) => /^(a|an|the)\b/i.test(label)),
      /\b(must|should|might|can|could)\b/i.test(blob),
      /\b(if|unless)\b/i.test(exercise.prompt ?? ''),
    ].filter(Boolean).length;
    return families >= 1 && labels.length >= 2;
  }).length;
  const pickRatio = b1Mc.length ? pickish / b1Mc.length : 0;
  if (pickRatio < 0.75) {
    score -= 15;
    notes.push(`B1 pick-ish MC ${pickish}/${b1Mc.length}`);
  }

  let dupes = 0;
  for (const key of ['a2', 'b1', 'b2', 'c1']) {
    const prompts = pack.exercises
      .filter((exercise) => exercise.lessonKey === key)
      .map((exercise) => normalizePrompt(exercise.prompt));
    const seen = new Set();
    for (const prompt of prompts) {
      if (seen.has(prompt)) {
        dupes += 1;
      }
      seen.add(prompt);
    }
  }
  if (dupes > 0) {
    score -= Math.min(20, dupes * 2);
    notes.push(`duplicate prompts ${dupes}`);
  }

  const advanced = pack.exercises.filter((exercise) => ['b2', 'c1'].includes(exercise.lessonKey));
  const discourse = {};
  for (const exercise of advanced) {
    const blob = `${exercise.prompt} ${exercise.explanation}`;
    for (const band of DISCOURSE) {
      if (band.re.test(blob)) {
        discourse[band.id] = (discourse[band.id] ?? 0) + 1;
      }
    }
  }
  const discourseKinds = Object.keys(discourse).length;
  const discourseHits = Object.values(discourse).reduce((sum, n) => sum + n, 0);
  if (discourseKinds < 2 || discourseHits < 4) {
    score -= 15;
    notes.push(`discourse kinds=${discourseKinds} hits=${discourseHits}`);
  }

  const contexts = pack.lessons.flatMap((lesson) =>
    (lesson.exampleSentences ?? []).map((row) => row[0]),
  );
  const daily = contexts.filter((context) => ['Slack', 'Standup', 'PR'].includes(context)).length;
  const dailyRatio = contexts.length ? daily / contexts.length : 0;
  if (dailyRatio < 0.2) {
    score -= 10;
    notes.push(`daily contexts ${(100 * dailyRatio).toFixed(0)}%`);
  }

  for (const lesson of pack.lessons) {
    const set = new Set((lesson.exampleSentences ?? []).map((row) => row[0]));
    if ((lesson.exampleSentences ?? []).length === 5 && set.size === 1) {
      score -= 5;
      notes.push(`${lesson.key} examples mono-context`);
    }
  }

  score = Math.max(0, Math.min(100, score));
  return {
    slug: pack.slug,
    title: pack.title,
    score,
    grade: grade(score),
    pickish: `${pickish}/${b1Mc.length}`,
    dupes,
    discourse: `${discourseKinds}k/${discourseHits}h`,
    daily: `${daily}/${contexts.length}`,
    notes,
  };
}

function main() {
  const packs = JSON.parse(readFileSync(PACKS_PATH, 'utf8'));
  const rows = packs.map(scoreTopic);
  const avg = rows.reduce((sum, row) => sum + row.score, 0) / Math.max(rows.length, 1);
  console.log('Topic scorecard (job-fit heuristics)\n');
  console.log(
    `${'slug'.padEnd(28)} ${'G'.padEnd(2)} ${'score'.padStart(5)} ${'B1'.padStart(
      6,
    )} ${'dup'.padStart(4)} ${'disc'.padStart(8)} ${'daily'.padStart(8)}`,
  );
  for (const row of rows) {
    console.log(
      `${row.slug.padEnd(28)} ${row.grade.padEnd(2)} ${String(row.score).padStart(
        5,
      )} ${row.pickish.padStart(6)} ${String(row.dupes).padStart(4)} ${row.discourse.padStart(
        8,
      )} ${row.daily.padStart(8)}${row.notes.length ? `  ! ${row.notes.join('; ')}` : ''}`,
    );
  }
  console.log(`\nAverage: ${avg.toFixed(1)} / ${rows.length} topics`);

  const jobFit = auditGrammarJobFit(packs);
  if (jobFit.length) {
    console.log(`\nGlobal job-fit gate: FAIL (${jobFit.length})`);
    for (const issue of jobFit.slice(0, 12)) {
      console.log(`- ${issue}`);
    }
    process.exit(1);
  }
  console.log('\nGlobal job-fit gate: OK');
}

const isCli = process.argv[1] && process.argv[1].endsWith('score-grammar-topics.mjs');
if (isCli) {
  main();
}
