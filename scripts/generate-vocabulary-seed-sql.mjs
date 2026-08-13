#!/usr/bin/env node
/**
 * Generate supabase/migrations/014_vocabulary_seed.sql from packs.json.
 * Deterministic UUIDs so re-seed upserts stay stable.
 *
 * Usage: pnpm run vocabulary:seed:sql
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const PACKS_PATH = resolve(ROOT, 'supabase/seed/vocabulary/packs.json');
const OUT_PATH = resolve(ROOT, 'supabase/migrations/014_vocabulary_seed.sql');
const CONTENT_SCHEMA = 1;
const CONTENT_REVISION = 1;

/** SQL string / jsonb literal (single-quoted). Objects become JSON text. */
function escLiteral(value) {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return `'${text.replace(/'/g, "''")}'`;
}

/** Deterministic UUIDv4-shaped id from namespace+name (not RFC4122 v5; stable for seed). */
function stableUuid(namespace, name) {
  const digest = createHash('sha256').update(`${namespace}:${name}`).digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
}

function main() {
  const packs = JSON.parse(readFileSync(PACKS_PATH, 'utf8'));
  if (!Array.isArray(packs.situations) || packs.situations.length !== 5) {
    throw new Error('packs.json must contain exactly 5 situations');
  }

  const lines = [
    'begin;',
    '',
    '-- PH3 Vocabulary seed generated from supabase/seed/vocabulary/packs.json',
    '-- Regenerate: pnpm run vocabulary:seed:sql',
    '',
    'delete from public.vocabulary_attempts;',
    'delete from public.user_vocabulary_progress;',
    'delete from public.vocabulary_exercises;',
    'delete from public.vocabulary_items;',
    'delete from public.vocabulary_situations;',
    '',
  ];

  let itemCount = 0;
  let exerciseCount = 0;

  for (const situation of packs.situations) {
    const situationId = stableUuid('vocab-situation', situation.slug);
    lines.push(
      `insert into public.vocabulary_situations (id, slug, title, description, sort_order, published)`,
    );
    lines.push(
      `values (${escLiteral(situationId)}::uuid, ${escLiteral(situation.slug)}, ${escLiteral(
        situation.title,
      )}, ${escLiteral(situation.description)}, ${situation.sortOrder}, true);`,
    );
    lines.push('');

    for (const item of situation.items) {
      itemCount += 1;
      const itemId = stableUuid('vocab-item', `${situation.slug}:${item.key}`);
      const content = {
        patterns: item.patterns ?? [],
        examples: item.examples ?? [],
        alternatives: item.alternatives ?? [],
        notes: item.notes ?? [],
        pos: item.pos ?? null,
      };
      lines.push(
        `insert into public.vocabulary_items (id, situation_id, item_key, type, term, meaning, context, level, pos, content, content_schema_version, content_revision, sort_order, published)`,
      );
      lines.push(
        `values (${escLiteral(itemId)}::uuid, ${escLiteral(situationId)}::uuid, ${escLiteral(
          item.key,
        )}, ${escLiteral(item.type)}, ${escLiteral(item.term)}, ${escLiteral(
          item.meaning,
        )}, ${escLiteral(item.context)}, ${escLiteral(item.level)}, ${
          item.pos ? escLiteral(item.pos) : 'null'
        }, ${escLiteral(content)}::jsonb, ${CONTENT_SCHEMA}, ${CONTENT_REVISION}, ${
          item.sortOrder
        }, true);`,
      );

      for (const [index, exercise] of (item.exercises ?? []).entries()) {
        exerciseCount += 1;
        const exerciseKey = exercise.key ?? `${item.key}-ex-${index + 1}`;
        const exerciseId = stableUuid('vocab-exercise', `${situation.slug}:${exerciseKey}`);
        lines.push(
          `insert into public.vocabulary_exercises (id, situation_id, item_id, exercise_key, type, prompt, payload, feedback, content_schema_version, sort_order, published)`,
        );
        lines.push(
          `values (${escLiteral(exerciseId)}::uuid, ${escLiteral(situationId)}::uuid, ${escLiteral(
            itemId,
          )}::uuid, ${escLiteral(exerciseKey)}, ${escLiteral(exercise.type)}, ${escLiteral(
            exercise.prompt,
          )}, ${escLiteral(exercise.payload)}::jsonb, ${escLiteral(
            exercise.feedback,
          )}::jsonb, ${CONTENT_SCHEMA}, ${exercise.sortOrder ?? index + 1}, true);`,
        );
      }
    }
    lines.push('');
  }

  lines.push('commit;');
  lines.push('');
  lines.push(
    `-- seed summary: situations=${packs.situations.length} items=${itemCount} exercises=${exerciseCount}`,
  );
  lines.push('');

  writeFileSync(OUT_PATH, `${lines.join('\n')}\n`, 'utf8');
  console.log(
    JSON.stringify(
      {
        out: OUT_PATH,
        situations: packs.situations.length,
        items: itemCount,
        exercises: exerciseCount,
      },
      null,
      2,
    ),
  );
}

main();
