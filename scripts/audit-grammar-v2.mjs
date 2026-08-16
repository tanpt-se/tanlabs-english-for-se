#!/usr/bin/env node
/**
 * Fail-closed audit for Lean Grammar v2 (packs-v2.json).
 * Usage: pnpm run grammar:audit
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fillBlankTemplate } from './fill-blank-template.mjs';

const ROOT = process.cwd();
const PACKS_PATH = resolve(ROOT, 'supabase/seed/grammar/packs-v2.json');
const LEXICON_PATH = resolve(ROOT, 'supabase/seed/grammar/lexicon.json');

const LIMITS = {
  usage: 280,
  form: 140,
  tip: 200,
  sentence: 200,
  context: 80,
  prompt: 280,
  explanation: 320,
  title: 80,
  description: 240,
  examples: 5,
  tipsMin: 1,
  tipsMax: 2,
  lessons: 3,
  exercisesMax: 8,
};

const CATEGORIES = [
  'core-tenses',
  'timeline-planning',
  'sentence-structure',
  'workplace-communication',
];

const ALLOWED_SLUGS = [
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
];

const OPTIONAL_SLUGS = new Set(['progress-earlier-past', 'future-milestones']);
const LESSON_KEYS = ['form', 'use', 'apply'];
const LEVELS = ['A2', 'B1', 'B2', 'C1'];

const CORRECT_DENY = [
  { re: /doesn't \w+s\b/i, label: "doesn't + 3sg" },
  { re: /didn't \w+ed\b/i, label: "didn't + V-ed" },
  { re: /will to /i, label: 'will to' },
  { re: /going to \w+ing\b/i, label: 'going to + V-ing' },
  { re: /\bis owning\b/i, label: 'is owning' },
  { re: /\bis needing\b/i, label: 'is needing' },
  { re: /\bis knowing\b/i, label: 'is knowing' },
  { re: /\bis meaning\b/i, label: 'is meaning' },
  { re: /should to /i, label: 'should to' },
  { re: /must to /i, label: 'must to' },
  { re: /can to /i, label: 'can to' },
  { re: /have .+\byesterday\b/i, label: 'have + yesterday' },
  { re: /has .+\byesterday\b/i, label: 'has + yesterday' },
  { re: /need to \w+ing\b/i, label: 'need to + V-ing' },
  { re: /avoid to /i, label: 'avoid to' },
  { re: /want to \w+ing\b/i, label: 'want to + V-ing' },
];

function hasCurly(text) {
  return /[’‘“”]/.test(text);
}

function correctAnswerText(exercise) {
  if (exercise.type === 'multiple_choice') {
    const options = exercise.payload?.options ?? [];
    const id = exercise.answer?.optionId;
    return options.find((option) => option.id === id)?.label ?? '';
  }
  if (exercise.type === 'fill_blank') {
    const template = exercise.payload?.template ?? '';
    const accepted = exercise.answer?.accepted ?? [];
    return fillBlankTemplate(template, accepted[0] ?? '');
  }
  if (exercise.type === 'sentence_order') {
    const tokens = exercise.payload?.tokens ?? [];
    return (exercise.answer?.tokenIds ?? [])
      .map((id) => tokens.find((token) => token.id === id)?.text ?? '')
      .join(' ');
  }
  return '';
}

export function auditGrammarV2Packs(packs, lexicon) {
  const issues = [];
  const fail = (message) => issues.push(message);
  const contextSet = new Set(lexicon.contexts ?? []);

  const lenOk = (label, text, max) => {
    if (typeof text !== 'string' || text.trim().length === 0) {
      fail(`${label}: empty`);
      return;
    }
    if (text.length > max) {
      fail(`${label}: ${text.length}>${max}`);
    }
    if (hasCurly(text)) {
      fail(`${label}: curly quote`);
    }
  };

  const denyCorrect = (label, text) => {
    if (typeof text !== 'string' || !text.trim()) return;
    for (const rule of CORRECT_DENY) {
      if (rule.re.test(text)) {
        fail(`${label}: accuracy deny (${rule.label}) — ${text}`);
      }
    }
  };

  if (!Array.isArray(packs) || packs.length !== 12) {
    fail(`topic count ${Array.isArray(packs) ? packs.length : 'invalid'} != 12`);
  }

  const seenSlugs = [];
  const categorySlugs = new Set();
  let lessonTotal = 0;

  for (const pack of packs ?? []) {
    seenSlugs.push(pack.slug);
    if (!ALLOWED_SLUGS.includes(pack.slug)) {
      fail(`unknown slug ${pack.slug}`);
    }
    if (!CATEGORIES.includes(pack.categorySlug)) {
      fail(`${pack.slug}: bad category ${pack.categorySlug}`);
    }
    categorySlugs.add(pack.categorySlug);
    if (pack.curriculumVersion !== 2) {
      fail(`${pack.slug}: curriculumVersion must be 2`);
    }
    if (Boolean(pack.isOptional) !== OPTIONAL_SLUGS.has(pack.slug)) {
      fail(`${pack.slug}: isOptional mismatch`);
    }
    lenOk(`${pack.slug} title`, pack.title, LIMITS.title);
    lenOk(`${pack.slug} description`, pack.description, LIMITS.description);

    if (!Array.isArray(pack.lessons) || pack.lessons.length !== LIMITS.lessons) {
      fail(`${pack.slug}: need ${LIMITS.lessons} lessons`);
    }
    lessonTotal += pack.lessons?.length ?? 0;

    const lessonKeys = new Set();
    for (const lesson of pack.lessons ?? []) {
      const loc = `${pack.slug}/${lesson.key}`;
      if (lessonKeys.has(lesson.key)) fail(`${loc}: duplicate lesson key`);
      lessonKeys.add(lesson.key);
      if (!LESSON_KEYS.includes(lesson.key)) fail(`${loc}: unexpected key`);
      if (!LEVELS.includes(lesson.level)) fail(`${loc}: bad level`);
      lenOk(`${loc} title`, lesson.title, LIMITS.title);
      lenOk(`${loc} description`, lesson.description, LIMITS.description);
      lenOk(`${loc} usage`, lesson.usage, LIMITS.usage);
      if (!String(lesson.usage ?? '').startsWith('Goal:')) {
        fail(`${loc}: usage must start with Goal:`);
      }
      for (const formKey of ['affirmative', 'negative', 'question']) {
        lenOk(`${loc} form.${formKey}`, lesson.forms?.[formKey], LIMITS.form);
      }
      const examples = lesson.exampleSentences;
      if (!Array.isArray(examples) || examples.length !== LIMITS.examples) {
        fail(`${loc}: examples ${examples?.length}, want ${LIMITS.examples}`);
      }
      (examples ?? []).forEach(([context, sentence], index) => {
        lenOk(`${loc} ex${index} context`, context, LIMITS.context);
        lenOk(`${loc} ex${index} sentence`, sentence, LIMITS.sentence);
        denyCorrect(`${loc} ex${index}`, sentence);
        if (contextSet.size > 0 && !contextSet.has(context)) {
          fail(`${loc} ex${index}: unknown context ${context}`);
        }
      });
      const tips = lesson.tips ?? [];
      if (tips.length < LIMITS.tipsMin || tips.length > LIMITS.tipsMax) {
        fail(`${loc}: tips ${tips.length} out of range`);
      }
      tips.forEach((tip, index) => lenOk(`${loc} tip${index}`, tip, LIMITS.tip));
    }

    const byLesson = new Map();
    for (const exercise of pack.exercises ?? []) {
      const list = byLesson.get(exercise.lessonKey) ?? [];
      list.push(exercise);
      byLesson.set(exercise.lessonKey, list);
      const loc = `${pack.slug}/${exercise.id}`;
      if (!LESSON_KEYS.includes(exercise.lessonKey)) {
        fail(`${loc}: bad lessonKey`);
      }
      lenOk(`${loc} prompt`, exercise.prompt, LIMITS.prompt);
      lenOk(`${loc} explanation`, exercise.explanation, LIMITS.explanation);
      denyCorrect(`${loc} correct`, correctAnswerText(exercise));
      if (exercise.type === 'sentence_order') {
        const tokens = exercise.payload?.tokens ?? [];
        if (tokens.length < 2 || tokens.length > 12) {
          fail(`${loc}: token count ${tokens.length}`);
        }
      }
    }

    for (const key of LESSON_KEYS) {
      const count = (byLesson.get(key) ?? []).length;
      if (count < 1 || count > LIMITS.exercisesMax) {
        fail(`${pack.slug}/${key}: ${count} exercises (want 1-${LIMITS.exercisesMax})`);
      }
    }
  }

  if (categorySlugs.size !== 4) {
    fail(`category count ${categorySlugs.size} != 4`);
  }
  if (lessonTotal !== 36) {
    fail(`lesson count ${lessonTotal} != 36`);
  }
  const missing = ALLOWED_SLUGS.filter((slug) => !seenSlugs.includes(slug));
  if (missing.length > 0) {
    fail(`missing topics: ${missing.join(', ')}`);
  }

  return issues;
}

function main() {
  const packs = JSON.parse(readFileSync(PACKS_PATH, 'utf8'));
  const lexicon = JSON.parse(readFileSync(LEXICON_PATH, 'utf8'));
  const issues = auditGrammarV2Packs(packs, lexicon);
  if (issues.length > 0) {
    console.error(`FAIL ${issues.length} grammar v2 issue(s):`);
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }
  console.log('OK grammar v2 packs (4 categories / 12 topics / 36 lessons / <=8 exercises)');
}

const isCli = process.argv[1] && process.argv[1].endsWith('audit-grammar-v2.mjs');
if (isCli) {
  main();
}
