#!/usr/bin/env node
/**
 * Local-seed smoke for Lean Grammar v2 + Vocabulary core (no hosted DB).
 * Usage: pnpm run smoke:local-seed
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();

function runAudit(script) {
  const result = spawnSync('node', [resolve(ROOT, script)], { encoding: 'utf8', cwd: ROOT });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${script} failed`);
  }
  process.stdout.write(result.stdout);
}

function main() {
  runAudit('scripts/audit-grammar-v2.mjs');
  runAudit('scripts/audit-vocabulary-core.mjs');

  const packs = JSON.parse(
    readFileSync(resolve(ROOT, 'supabase/seed/grammar/packs-v2.json'), 'utf8'),
  );
  if (packs.length !== 12) {
    throw new Error(`packs-v2 topics ${packs.length} != 12`);
  }
  for (const topic of packs) {
    if (!String(topic.lessons?.[0]?.usage ?? '').startsWith('Goal:')) {
      throw new Error(`${topic.slug}: lesson usage must start with Goal:`);
    }
  }

  const core = JSON.parse(
    readFileSync(resolve(ROOT, 'supabase/seed/vocabulary/core-expressions.json'), 'utf8'),
  );
  const items = core.situations.flatMap((situation) => situation.items);
  if (items.length !== 50) {
    throw new Error(`core items ${items.length} != 50`);
  }
  if (items.some((item) => /[.!?]$/.test(String(item.term).trim()))) {
    throw new Error('core terms must be phrases/collocations, not full sentences');
  }

  console.log('OK local-seed smoke (grammar v2 + vocabulary core)');
}

main();
