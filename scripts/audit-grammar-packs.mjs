#!/usr/bin/env node
/**
 * Fail-closed authoring audit for supabase/seed/grammar/packs.json.
 * Usage: pnpm run grammar:audit
 *
 * Spec: supabase/seed/grammar/AUTHORING.md
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fillBlankTemplate, hasFillBlankCue } from './fill-blank-template.mjs';

const ROOT = process.cwd();
const PACKS_PATH = resolve(ROOT, 'supabase/seed/grammar/packs.json');
const LEXICON_PATH = resolve(ROOT, 'supabase/seed/grammar/lexicon.json');

const LIMITS = {
  usage: 220,
  form: 80,
  tip: 120,
  sentence: 200,
  context: 80,
  prompt: 280,
  explanation: 320,
  title: 80,
  description: 140,
  examples: 5,
  tips: 2,
  exercises: 18,
};

const LEVELS = ['A2', 'B1', 'B2', 'C1'];
const LESSON_KEYS = LEVELS.map((level) => level.toLowerCase());

const ALLOWED_SLUGS = [
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
];

const TYPE_ORDER = {
  A2: [
    ...Array(6).fill('multiple_choice'),
    ...Array(6).fill('fill_blank'),
    ...Array(6).fill('sentence_order'),
  ],
  B1: [
    ...Array(8).fill('multiple_choice'),
    ...Array(6).fill('fill_blank'),
    ...Array(4).fill('sentence_order'),
  ],
  B2: [
    ...Array(6).fill('multiple_choice'),
    ...Array(6).fill('fill_blank'),
    ...Array(6).fill('sentence_order'),
  ],
  C1: [
    ...Array(6).fill('multiple_choice'),
    ...Array(6).fill('fill_blank'),
    ...Array(6).fill('sentence_order'),
  ],
};

/** Ungrammatical or cue-mismatched forms that must never be a correct key / example / form line. */
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
  {
    re: /at \d{1,2}:\d{2}.+have (already )?(shifted|patched|mitigated)/i,
    label: 'clock stamp + perfect',
  },
  { re: /need to \w+ing\b/i, label: 'need to + V-ing' },
  { re: /avoid to /i, label: 'avoid to' },
  { re: /want to \w+ing\b/i, label: 'want to + V-ing' },
];

const TENSE_FAMILY = [
  { id: 'continuous', re: /\b(am|is|are|isn't|aren't|'m|'s|'re)\s+\w+ing\b/i },
  { id: 'ingOnly', re: /^\w+ing$/i },
  { id: 'perfect', re: /\b(have|has|haven't|hasn't|'ve)\s+/i },
  { id: 'past', re: /\b(did|didn't|was|were|wasn't|weren't)\b/i },
  { id: 'futureWill', re: /\b(will|won't)\b/i },
  { id: 'goingTo', re: /\bgoing to\b/i },
  { id: 'must', re: /\bmusts?\b/i },
  { id: 'should', re: /\bshould\b/i },
  { id: 'can', re: /\b(can|could|can't|cannot)\b/i },
  { id: 'might', re: /\bmight\b/i },
  { id: 'simpleDo', re: /\b(do|does|don't|doesn't)\b/i },
  { id: 'articleA', re: /^(a|an)\b/i },
  { id: 'articleThe', re: /^the\b/i },
  { id: 'passive', re: /\b(is|are|was|were|been)\s+\w+(ed|en)\b/i },
  { id: 'told', re: /\btold\b/i },
  { id: 'said', re: /\b(said|says)\b/i },
  { id: 'toInf', re: /(^|\s)to(\s|$)/i },
  { id: 'gerundForm', re: /\b\w+ing\b/i },
  { id: 'linkerHowever', re: /\bhowever\b/i },
  { id: 'linkerSo', re: /(^so\b|\bso\b)/i },
  { id: 'linkerBecause', re: /\bbecause\b/i },
  { id: 'whichMeans', re: /\bwhich means\b|\bmeans\b/i },
];

const PROSE_BAND = [
  { id: 'simple', re: /\bsimple\b/i },
  { id: 'continuous', re: /\bcontinuous\b/i },
  { id: 'perfect', re: /\bperfect\b/i },
  { id: 'past', re: /\bpast\b/i },
  { id: 'will', re: /\bwill\b/i },
  { id: 'goingTo', re: /\bgoing to\b/i },
  { id: 'modal', re: /\b(must|should|might|can)\b/i },
  { id: 'voice', re: /\b(passive|active)\b/i },
  { id: 'article', re: /\b(article|generic|uncount|identified)\b/i },
  { id: 'report', re: /\b(said|told|backshift)\b/i },
  { id: 'cond', re: /\b(unless|zero|first)\b/i },
  { id: 'habitCue', re: /\b(every|usually|never|always|still|friday|monday)\b/i },
  { id: 'nowCue', re: /\b(right now|at the moment|currently)\b/i },
  { id: 'pastCue', re: /\b(yesterday|last night|last week|at \d{1,2}:\d{2})\b/i },
  { id: 'perfectCue', re: /\b(yet|already|so far|since)\b/i },
  { id: 'gerund', re: /\bgerund\b/i },
  { id: 'infinitive', re: /\b(infinitive|to-infinitive|to \+ base)\b/i },
  { id: 'linker', re: /\b(linker|contrast|reason|result|which means)\b/i },
];

/** @param {string} text */
function hasCurly(text) {
  return /[’‘“”]/.test(text);
}

/** @param {string} text */
function words(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** @param {string} text */
function tenseFamilies(text) {
  const hits = TENSE_FAMILY.filter((family) => family.re.test(text.trim())).map(
    (family) => family.id,
  );
  if (hits.length === 0 && text.trim().split(/\s+/).length <= 4) {
    return ['bare'];
  }
  return hits;
}

/** @param {string} text */
function proseBands(text) {
  return PROSE_BAND.filter((band) => band.re.test(text)).map((band) => band.id);
}

/**
 * @param {{ type: string, payload?: Record<string, unknown>, answer?: Record<string, unknown> }} exercise
 */
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

/**
 * @param {unknown} packs
 * @param {{ contexts: string[], tokens: string[], forbidden: string[] }} lexicon
 */
export function auditGrammarPacks(packs, lexicon) {
  const issues = [];
  const contextSet = new Set(lexicon.contexts);
  const tokenSet = new Set(lexicon.tokens.map((item) => item.toLowerCase()));
  const forbiddenSet = new Set(lexicon.forbidden.map((item) => item.toLowerCase()));

  const fail = (message) => {
    issues.push(message);
  };

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
    if (typeof text !== 'string' || text.trim().length === 0) {
      return;
    }
    for (const rule of CORRECT_DENY) {
      if (rule.re.test(text)) {
        fail(`${label}: accuracy deny (${rule.label}) — ${text}`);
      }
    }
  };

  const hasSeToken = (text) => words(text).some((word) => tokenSet.has(word));
  const hasForbidden = (text) => words(text).some((word) => forbiddenSet.has(word));

  if (!Array.isArray(packs) || packs.length !== ALLOWED_SLUGS.length) {
    fail(
      `topic count ${Array.isArray(packs) ? packs.length : 'invalid'} != ${ALLOWED_SLUGS.length}`,
    );
  }

  const seenIds = new Set();
  const seenSlugs = [];

  for (const pack of packs ?? []) {
    seenSlugs.push(pack.slug);
    if (!ALLOWED_SLUGS.includes(pack.slug)) {
      fail(`unknown slug ${pack.slug}`);
    }
    if (pack.level != null) {
      fail(`${pack.slug}: topic.level must be omitted`);
    }
    lenOk(`${pack.slug} title`, pack.title, LIMITS.title);
    lenOk(`${pack.slug} description`, pack.description, LIMITS.description);
    if (!Array.isArray(pack.lessons) || pack.lessons.length !== 4) {
      fail(`${pack.slug}: need 4 lessons`);
    }
    if (!Array.isArray(pack.exercises)) {
      fail(`${pack.slug}: exercises missing`);
      continue;
    }

    const lessonKeys = new Set();
    const a2Sentences = new Set();

    for (const lesson of pack.lessons ?? []) {
      const loc = `${pack.slug}/${lesson.key}`;
      if (lessonKeys.has(lesson.key)) {
        fail(`${loc}: duplicate lesson key`);
      }
      lessonKeys.add(lesson.key);
      if (!LESSON_KEYS.includes(lesson.key)) {
        fail(`${loc}: unexpected key`);
      }
      if (!LEVELS.includes(lesson.level)) {
        fail(`${loc}: bad level`);
      }
      if (lesson.key !== lesson.level.toLowerCase()) {
        fail(`${loc}: key/level mismatch`);
      }
      lenOk(`${loc} title`, lesson.title, LIMITS.title);
      lenOk(`${loc} description`, lesson.description, LIMITS.description);
      lenOk(`${loc} usage`, lesson.usage, LIMITS.usage);
      denyCorrect(`${loc} usage`, lesson.usage);
      for (const formKey of ['affirmative', 'negative', 'question']) {
        lenOk(`${loc} form.${formKey}`, lesson.forms?.[formKey], LIMITS.form);
        denyCorrect(`${loc} form.${formKey}`, lesson.forms?.[formKey]);
      }
      const examples = lesson.exampleSentences;
      if (!Array.isArray(examples) || examples.length !== LIMITS.examples) {
        fail(`${loc}: examples ${examples?.length}, want ${LIMITS.examples}`);
      }
      (examples ?? []).forEach(([context, sentence], index) => {
        lenOk(`${loc} ex${index} context`, context, LIMITS.context);
        lenOk(`${loc} ex${index} sentence`, sentence, LIMITS.sentence);
        denyCorrect(`${loc} ex${index}`, sentence);
        if (!contextSet.has(context)) {
          fail(`${loc} ex${index}: context "${context}" not in allowlist`);
        }
        if (!hasSeToken(sentence)) {
          fail(`${loc} ex${index}: no SE lexicon token — ${sentence}`);
        }
        if (hasForbidden(sentence)) {
          fail(`${loc} ex${index}: forbidden textbook word — ${sentence}`);
        }
        if (lesson.level === 'A2') {
          a2Sentences.add(sentence.trim().toLowerCase());
        }
      });
      const tips = lesson.tips;
      if (!Array.isArray(tips) || tips.length !== LIMITS.tips) {
        fail(`${loc}: tips ${tips?.length}, want ${LIMITS.tips}`);
      }
      (tips ?? []).forEach((tip, index) => lenOk(`${loc} tip${index}`, tip, LIMITS.tip));
    }

    for (const lesson of pack.lessons ?? []) {
      if (lesson.level === 'A2') {
        continue;
      }
      for (const [, sentence] of lesson.exampleSentences ?? []) {
        if (a2Sentences.has(sentence.trim().toLowerCase())) {
          fail(`${pack.slug}/${lesson.key}: example clones A2 — ${sentence}`);
        }
      }
    }

    const a2Exercises = pack.exercises.filter((exercise) => exercise.lessonKey === 'a2');

    for (const lesson of pack.lessons ?? []) {
      const items = pack.exercises.filter((exercise) => exercise.lessonKey === lesson.key);
      if (items.length !== LIMITS.exercises) {
        fail(`${pack.slug}/${lesson.key}: ${items.length} exercises, want ${LIMITS.exercises}`);
      }
      const types = items.map((exercise) => exercise.type);
      const expected = TYPE_ORDER[lesson.level];
      if (expected && types.join(',') !== expected.join(',')) {
        fail(`${pack.slug}/${lesson.key}: type order ${types.join(',')}`);
      }

      if (lesson.level === 'B1') {
        const contrastMc = items.filter((exercise) => {
          if (exercise.type !== 'multiple_choice') {
            return false;
          }
          const labels = (exercise.payload?.options ?? []).map((option) => option.label ?? '');
          const families = new Set(labels.flatMap((label) => tenseFamilies(label)));
          return families.size >= 2;
        }).length;
        if (contrastMc < 6) {
          fail(`${pack.slug}/${lesson.key}: B1 pick-the-tense MC ${contrastMc}<6`);
        }
        const contrastItems = items.filter((exercise) => {
          if (exercise.type === 'multiple_choice') {
            const labels = (exercise.payload?.options ?? []).map((option) => option.label ?? '');
            return new Set(labels.flatMap((label) => tenseFamilies(label))).size >= 2;
          }
          const hay = `${exercise.prompt} ${exercise.explanation} ${correctAnswerText(exercise)}`;
          const bands = new Set([...tenseFamilies(hay), ...proseBands(hay)]);
          return bands.size >= 2;
        }).length;
        if (contrastItems < 12) {
          fail(`${pack.slug}/${lesson.key}: B1 contrast items ${contrastItems}<12`);
        }
      }
    }

    for (const exercise of pack.exercises) {
      const loc = exercise.id ?? '(missing id)';
      if (!exercise.id || seenIds.has(exercise.id)) {
        fail(`duplicate or missing exercise id ${loc}`);
      }
      seenIds.add(exercise.id);
      if (!lessonKeys.has(exercise.lessonKey)) {
        fail(`${loc}: unknown lessonKey ${exercise.lessonKey}`);
      }
      lenOk(`${loc} prompt`, exercise.prompt, LIMITS.prompt);
      lenOk(`${loc} explanation`, exercise.explanation, LIMITS.explanation);

      const haystacks = [exercise.prompt, exercise.explanation];
      if (exercise.type === 'fill_blank') {
        haystacks.push(exercise.payload?.template ?? '');
      }
      if (exercise.type === 'sentence_order') {
        haystacks.push(correctAnswerText(exercise));
      }
      if (!haystacks.some((text) => hasSeToken(text))) {
        fail(`${loc}: no SE lexicon token`);
      }
      if (haystacks.some((text) => hasForbidden(text))) {
        fail(`${loc}: forbidden textbook word`);
      }

      const correct = correctAnswerText(exercise);
      denyCorrect(`${loc} correct`, correct);

      if (exercise.type === 'multiple_choice') {
        const options = exercise.payload?.options ?? [];
        const ids = options.map((option) => option.id);
        if (options.length < 2 || options.length > 6) {
          fail(`${loc}: MC option count`);
        }
        if (new Set(ids).size !== ids.length) {
          fail(`${loc}: duplicate option ids`);
        }
        if (!ids.includes(exercise.answer?.optionId)) {
          fail(`${loc}: answer not in options`);
        }
        const keyHits = options.filter((option) => option.id === exercise.answer?.optionId);
        if (keyHits.length !== 1) {
          fail(`${loc}: need exactly one MC key`);
        }
      } else if (exercise.type === 'fill_blank') {
        const template = exercise.payload?.template ?? '';
        const blanks = template.match(/___/g) ?? [];
        if (blanks.length !== 1) {
          fail(`${loc}: template ___ count=${blanks.length}`);
        }
        if (!hasFillBlankCue(template)) {
          fail(`${loc}: fill-blank needs ___ (cue) for the form to produce`);
        }
        if (exercise.prompt !== template) {
          fail(`${loc}: fill-blank prompt must equal template`);
        }
        const accepted = exercise.answer?.accepted ?? [];
        if (accepted.length < 1 || accepted.length > 8) {
          fail(`${loc}: accepted out of range`);
        }
        const needsNegativeCue =
          /^(don'?t|do not|doesn'?t|does not|didn'?t|did not|haven'?t|have not|hasn'?t|has not|aren'?t|are not|isn'?t|is not|won'?t|will not|shouldn'?t|should not|couldn'?t|could not|can'?t|cannot|mustn'?t|must not|wouldn'?t|would not|not)$/i.test(
            accepted[0] ?? '',
          );
        if (needsNegativeCue && !/·\s*negative/i.test(template)) {
          fail(`${loc}: negative fill-blank needs · negative in the cue`);
        }
        const stripped = template.replace(/___\s*\([^)]*\)/g, '___');
        const needsQuestionCue =
          /^(Do|Does|Did|Have|Has|Are|Is|Was|Were|Will|Should|Could|Must|Can)$/.test(
            accepted[0] ?? '',
          ) &&
          (/\?/.test(template) || /^\s*___/.test(stripped));
        if (needsQuestionCue && !/·\s*question/i.test(template)) {
          fail(`${loc}: question fill-blank needs · question in the cue`);
        }
        const needsAffirmativeCue =
          !needsNegativeCue &&
          !needsQuestionCue &&
          /^(am|is|are|was|were|been|do|does|did|have|has|had|will|would|should|could|must|might|can|going)$/i.test(
            accepted[0] ?? '',
          );
        if (needsAffirmativeCue && !/·\s*affirmative/i.test(template)) {
          fail(`${loc}: affirmative aux fill-blank needs · affirmative in the cue`);
        }
        const filled = fillBlankTemplate(template, accepted[0] ?? '');
        if (filled.includes('___') || /\s{2,}/.test(filled)) {
          fail(`${loc}: accepted does not fit template`);
        }
      } else if (exercise.type === 'sentence_order') {
        const tokens = exercise.payload?.tokens ?? [];
        const ids = tokens.map((token) => token.id);
        if (tokens.length < 2 || tokens.length > 12) {
          fail(`${loc}: token count ${tokens.length}`);
        }
        if (new Set(ids).size !== ids.length) {
          fail(`${loc}: duplicate token ids`);
        }
        if ((exercise.answer?.tokenIds ?? []).length !== tokens.length) {
          fail(`${loc}: tokenIds length`);
        }
        for (const id of exercise.answer?.tokenIds ?? []) {
          if (!ids.includes(id)) {
            fail(`${loc}: unknown token ${id}`);
          }
        }
        if (!/[.?!]$/.test(correct.trim())) {
          fail(`${loc}: reconstructed sentence missing end punct: ${correct}`);
        }
      } else {
        fail(`${loc}: unknown type ${exercise.type}`);
      }

      if (exercise.lessonKey !== 'a2') {
        const clone = a2Exercises.find(
          (a2) =>
            JSON.stringify(a2.payload) === JSON.stringify(exercise.payload) &&
            JSON.stringify(a2.answer) === JSON.stringify(exercise.answer),
        );
        if (clone) {
          fail(`${loc}: payload clones ${clone.id}`);
        }
      }
    }
  }

  const unexpected = (packs ?? [])
    .map((pack) => pack.slug)
    .filter((slug) => !ALLOWED_SLUGS.includes(slug));
  for (const slug of unexpected) {
    fail(`unexpected slug ${slug}`);
  }
  const missing = ALLOWED_SLUGS.filter((slug) => !seenSlugs.includes(slug));
  for (const slug of missing) {
    fail(`missing slug ${slug}`);
  }

  return issues;
}

function main() {
  const packs = JSON.parse(readFileSync(PACKS_PATH, 'utf8'));
  const lexicon = JSON.parse(readFileSync(LEXICON_PATH, 'utf8'));
  const issues = auditGrammarPacks(packs, lexicon);
  if (issues.length > 0) {
    console.error(`ISSUES ${issues.length}`);
    for (const issue of issues) {
      console.error(`! ${issue}`);
    }
    process.exit(1);
  }
  console.log(
    `OK ${packs.length} topics, ${packs.reduce(
      (count, pack) => count + pack.lessons.length,
      0,
    )} lessons, ${packs.reduce((count, pack) => count + pack.exercises.length, 0)} exercises`,
  );
}

const isCli = process.argv[1] && process.argv[1].endsWith('audit-grammar-packs.mjs');
if (isCli) {
  main();
}
