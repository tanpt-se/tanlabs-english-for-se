#!/usr/bin/env node
/**
 * Write supabase/seed/grammar/packs-v2.json from the Lean Grammar v2 curriculum.
 * Usage: pnpm run grammar:v2:packs
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { coreTenseTopics } from './lib/grammar-v2-core-tenses.mjs';
import { structureTopics } from './lib/grammar-v2-structure.mjs';
import { timelineTopics } from './lib/grammar-v2-timeline.mjs';
import { workplaceTopics } from './lib/grammar-v2-workplace.mjs';

const ROOT = process.cwd();
const OUT_PATH = resolve(ROOT, 'supabase/seed/grammar/packs-v2.json');

const packs = [
  ...coreTenseTopics(),
  ...timelineTopics(),
  ...structureTopics(),
  ...workplaceTopics(),
];

writeFileSync(OUT_PATH, `${JSON.stringify(packs, null, 2)}\n`);
console.log(
  `Wrote ${OUT_PATH} (${packs.length} topics, ${packs.reduce(
    (sum, pack) => sum + pack.lessons.length,
    0,
  )} lessons, ${packs.reduce((sum, pack) => sum + pack.exercises.length, 0)} exercises)`,
);
