#!/usr/bin/env node
/**
 * Audit 5 situations x 10 core expressions.
 * Usage: node scripts/audit-vocabulary-core.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const CORE_PATH = resolve(ROOT, 'supabase/seed/vocabulary/core-expressions.json');
const SITUATIONS = [
  'daily-standup',
  'meetings',
  'task-progress',
  'bugs-problems',
  'client-communication',
];

export function auditVocabularyCore(root) {
  const issues = [];
  const fail = (message) => issues.push(message);
  const situations = root?.situations;
  if (!Array.isArray(situations) || situations.length !== 5) {
    fail(`situation count ${situations?.length ?? 'invalid'} != 5`);
    return issues;
  }
  const seenTerms = new Set();
  const seenSlugs = [];
  for (const situation of situations) {
    seenSlugs.push(situation.slug);
    if (!SITUATIONS.includes(situation.slug)) {
      fail(`unknown situation ${situation.slug}`);
    }
    const items = situation.items ?? [];
    if (items.length !== 10) {
      fail(`${situation.slug}: ${items.length} core items != 10`);
    }
    const orders = new Set();
    for (const item of items) {
      const loc = `${situation.slug}/${item.term}`;
      const termKey = String(item.term ?? '')
        .trim()
        .toLowerCase();
      if (!termKey) fail(`${loc}: empty term`);
      if (seenTerms.has(termKey)) fail(`${loc}: duplicate term`);
      seenTerms.add(termKey);
      if (!['word', 'phrase', 'expression'].includes(item.type)) {
        fail(`${loc}: bad type`);
      }
      if (!Number.isInteger(item.coreOrder) || item.coreOrder < 1 || item.coreOrder > 10) {
        fail(`${loc}: bad coreOrder`);
      }
      if (orders.has(item.coreOrder)) fail(`${loc}: duplicate coreOrder`);
      orders.add(item.coreOrder);
      if (item.type === 'expression' && /[.!?]$/.test(String(item.term).trim())) {
        fail(`${loc}: prefer a phrase/collocation, not a full sentence`);
      }
      const pronunciation = String(item.pronunciation ?? '').trim();
      if (!pronunciation) fail(`${loc}: missing pronunciation`);
      if (/^\/.+\/$/.test(pronunciation) || /[ˈˌɑɒəɜɪʊæθðŋ]/.test(pronunciation)) {
        fail(`${loc}: use English respelling, not IPA slashes`);
      }
      if (!['countable', 'uncountable', 'both', 'na'].includes(item.countability)) {
        fail(`${loc}: bad countability`);
      }
      if (item.type !== 'word' && item.countability !== 'na') {
        fail(`${loc}: non-word cores must use countability na`);
      }
      if (item.type === 'word' && item.countability === 'na') {
        fail(`${loc}: word cores need countable / uncountable / both`);
      }
    }
  }
  const missing = SITUATIONS.filter((slug) => !seenSlugs.includes(slug));
  if (missing.length > 0) fail(`missing situations: ${missing.join(', ')}`);
  if (seenTerms.size !== 50) fail(`unique core terms ${seenTerms.size} != 50`);
  return issues;
}

function main() {
  const root = JSON.parse(readFileSync(CORE_PATH, 'utf8'));
  const issues = auditVocabularyCore(root);
  if (issues.length > 0) {
    console.error(`FAIL ${issues.length} vocabulary core issue(s):`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }
  console.log('OK vocabulary core (5 situations / 10 core expressions each)');
}

const isCli = process.argv[1] && process.argv[1].endsWith('audit-vocabulary-core.mjs');
if (isCli) {
  main();
}
