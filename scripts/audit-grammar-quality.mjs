#!/usr/bin/env node
/**
 * Soft/hard quality gates for workplace job-fit (beyond accuracy audit).
 * Usage: pnpm run grammar:audit:quality
 *
 * Spec: supabase/seed/grammar/AUTHORING.md § Job-shaped practice
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const PACKS_PATH = resolve(ROOT, 'supabase/seed/grammar/packs.json');

const DISCOURSE = [
  { id: 'request', re: /\b(could you|can you|please|would you|mind)\b/i },
  { id: 'status', re: /\b(right now|at the moment|currently|so far|still|status)\b/i },
  { id: 'hedge', re: /\b(might|may |could be|seems|appears|unmeasured|hypothesis)\b/i },
  { id: 'decision', re: /\b(okay[, —-]|i will|we'll|going to)\b/i },
  { id: 'advise', re: /\b(should|must|need to|have to|recommend)\b/i },
];

const TENSE_FAMILY = [
  { id: 'continuous', re: /\b(am|is|are)\s+\w+ing\b|^\w+ing$/i },
  { id: 'perfect', re: /\b(have|has|haven't|hasn't|'ve)\b/i },
  {
    id: 'past',
    re: /\b(did|didn't|was|were|went|fixed|merged|shipped|resolved|updated|closed|rolled|signed)\b/i,
  },
  { id: 'futureWill', re: /\b(will|won't)\b/i },
  { id: 'goingTo', re: /\bgoing to\b/i },
  { id: 'modal', re: /\b(must|should|might|can|could)\b/i },
  { id: 'articleA', re: /^(a|an)\b/i },
  { id: 'articleThe', re: /^the\b/i },
  { id: 'bareNoun', re: /^(latency|traffic|production|postgres|coverage)\b/i },
  { id: 'toInf', re: /(^|\s)to(\s|$)/i },
  { id: 'gerundForm', re: /\b\w+ing\b/i },
  { id: 'linkerHowever', re: /\bhowever\b/i },
  { id: 'linkerSo', re: /(^so\b|\bso\b)/i },
  { id: 'linkerBecause', re: /\bbecause\b/i },
  { id: 'whichMeans', re: /\bmeans\b/i },
  { id: 'simple3sg', re: /\b\w+s\b/i },
  { id: 'base', re: /^[a-z-]+$/i },
];

/** @param {string} text */
function normalizePrompt(prompt) {
  return String(prompt ?? '')
    .toLowerCase()
    .replace(/___+/g, '___')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} label
 */
function optionFamilies(label) {
  const hits = TENSE_FAMILY.filter((family) => family.re.test(label.trim())).map(
    (family) => family.id,
  );
  return hits.length > 0 ? hits : ['other'];
}

/**
 * B1 MC is "pick the tense" when options span ≥2 tense families
 * (or explanation names a contrast cue).
 * @param {{ type: string, prompt?: string, explanation?: string, payload?: { options?: { label: string }[] } }} exercise
 */
function isPickTheTense(exercise) {
  if (exercise.type !== 'multiple_choice') {
    return false;
  }
  const labels = (exercise.payload?.options ?? []).map((option) => option.label);
  const families = new Set(labels.flatMap((label) => optionFamilies(label)));
  if (families.size >= 2) {
    return true;
  }
  const explanation = String(exercise.explanation ?? '');
  return /\b(vs|versus|not |contrast|habit|now|yet|yesterday|perfect|continuous|simple|will|going to)\b/i.test(
    explanation,
  );
}

/**
 * @param {unknown} packs
 */
export function auditGrammarJobFit(packs) {
  const issues = [];
  const fail = (message) => {
    issues.push(message);
  };

  if (!Array.isArray(packs)) {
    return ['packs must be an array'];
  }

  /** @type {Record<string, number>} */
  const contextCounts = {};

  for (const pack of packs) {
    const slug = pack.slug ?? '?';

    for (const lesson of pack.lessons ?? []) {
      const contexts = (lesson.exampleSentences ?? []).map((row) => row[0]);
      const unique = new Set(contexts);
      if (contexts.length === 5 && unique.size === 1) {
        fail(`${slug}/${lesson.key}: all 5 examples share context "${contexts[0]}"`);
      }
      for (const context of contexts) {
        contextCounts[context] = (contextCounts[context] ?? 0) + 1;
      }
    }

    for (const key of ['a2', 'b1', 'b2', 'c1']) {
      const items = (pack.exercises ?? []).filter((exercise) => exercise.lessonKey === key);
      const prompts = items.map((exercise) => normalizePrompt(exercise.prompt));
      const seen = new Map();
      prompts.forEach((prompt, index) => {
        if (!prompt || prompt === 'order the tokens.') {
          // SO boilerplate is upgraded separately; still flag if left as-is.
          if (prompt === 'order the tokens.') {
            fail(`${slug}/${key}#${index + 1}: SO prompt still boilerplate "Order the tokens."`);
          }
          return;
        }
        if (seen.has(prompt)) {
          fail(
            `${slug}/${key}: duplicate prompt — "${prompt.slice(0, 72)}" (items ${seen.get(
              prompt,
            )} & ${index + 1})`,
          );
        } else {
          seen.set(prompt, index + 1);
        }
      });
    }

    const b1Mc = (pack.exercises ?? []).filter(
      (exercise) => exercise.lessonKey === 'b1' && exercise.type === 'multiple_choice',
    );
    const pickCount = b1Mc.filter(isPickTheTense).length;
    if (b1Mc.length >= 8 && pickCount < 6) {
      fail(`${slug}/b1: pick-the-tense MC ${pickCount}/8 (want ≥6)`);
    }

    const advanced = (pack.exercises ?? []).filter((exercise) =>
      ['b2', 'c1'].includes(exercise.lessonKey),
    );
    /** @type {Record<string, number>} */
    const discourseHits = {};
    for (const exercise of advanced) {
      const blob = [
        exercise.prompt,
        exercise.explanation,
        ...(exercise.payload?.options ?? []).map((option) => option.label),
        ...(exercise.answer?.accepted ?? []),
        ...(exercise.payload?.tokens ?? []).map((token) => token.text ?? token.label),
      ]
        .filter(Boolean)
        .join(' ');
      for (const band of DISCOURSE) {
        if (band.re.test(blob)) {
          discourseHits[band.id] = (discourseHits[band.id] ?? 0) + 1;
        }
      }
    }
    const discourseKinds = Object.keys(discourseHits).length;
    const discourseTotal = Object.values(discourseHits).reduce((sum, n) => sum + n, 0);
    if (discourseKinds < 2 || discourseTotal < 4) {
      fail(
        `${slug}: B2+C1 discourse too thin (kinds=${discourseKinds}, hits=${discourseTotal}; want ≥2 kinds & ≥4 hits)`,
      );
    }
  }

  const exampleTotal = Object.values(contextCounts).reduce((sum, n) => sum + n, 0);
  const daily = (contextCounts.Slack ?? 0) + (contextCounts.Standup ?? 0) + (contextCounts.PR ?? 0);
  if (exampleTotal > 0 && daily / exampleTotal < 0.22) {
    fail(
      `example context skew: Slack+Standup+PR = ${daily}/${exampleTotal} (${(
        (100 * daily) /
        exampleTotal
      ).toFixed(0)}%, want ≥22%)`,
    );
  }

  return issues;
}

function main() {
  const packs = JSON.parse(readFileSync(PACKS_PATH, 'utf8'));
  const issues = auditGrammarJobFit(packs);
  if (issues.length > 0) {
    console.error(`FAIL ${issues.length} job-fit issue(s):`);
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }
  console.log('OK job-fit quality');
}

const isCli = process.argv[1] && process.argv[1].endsWith('audit-grammar-quality.mjs');
if (isCli) {
  main();
}
