import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  GRAMMAR_EXERCISES,
  GRAMMAR_LESSONS,
  GRAMMAR_TOPICS,
} from '@/features/grammar/data/seedInventory';

/**
 * Dev utility exercised by CI as an assertion that inventory is seedable.
 * Writes supabase/migrations/008_grammar_seed.sql when GRAMMAR_WRITE_SEED=1.
 */
describe('grammar seed SQL export', () => {
  it('can serialize the inventory into deterministic SQL', () => {
    const topicIds: Record<string, string> = {
      'present-simple': 'a1000000-0000-4000-8000-000000000001',
      'present-continuous': 'a1000000-0000-4000-8000-000000000002',
      'past-simple': 'a1000000-0000-4000-8000-000000000003',
      'present-perfect': 'a1000000-0000-4000-8000-000000000004',
      'future-forms': 'a1000000-0000-4000-8000-000000000005',
    };
    const lessonIds = Object.fromEntries(
      GRAMMAR_LESSONS.map((lesson, index) => [
        lesson.slug,
        `a2000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      ]),
    );

    const esc = (value: unknown) => JSON.stringify(value).replace(/'/g, "''");
    const sql: string[] = [
      'begin;',
      '-- Grammar seed generated from src/features/grammar/data/seedInventory.ts',
      'delete from public.grammar_attempts;',
      'delete from public.user_grammar_progress;',
      'delete from public.grammar_exercises;',
      'delete from public.grammar_lessons;',
      'delete from public.grammar_topics;',
    ];

    for (const topic of GRAMMAR_TOPICS) {
      sql.push(`insert into public.grammar_topics (id, slug, title, description, level, sort_order, published)
values ('${topicIds[topic.slug]}', '${topic.slug}', '${topic.title.replace(
        /'/g,
        "''",
      )}', '${topic.description.replace(/'/g, "''")}', '${topic.level}', ${topic.sortOrder}, true)
on conflict (slug) do update set title = excluded.title, description = excluded.description, level = excluded.level, sort_order = excluded.sort_order, published = excluded.published, updated_at = now();`);
    }

    for (const lesson of GRAMMAR_LESSONS) {
      sql.push(`insert into public.grammar_lessons (id, topic_id, slug, summary, content, content_schema_version, content_revision, sort_order, published)
values ('${lessonIds[lesson.slug]}', '${topicIds[lesson.topicSlug]}', '${
        lesson.slug
      }', '${lesson.summary.replace(/'/g, "''")}', '${esc(lesson.content)}'::jsonb, ${
        lesson.contentSchemaVersion
      }, ${lesson.contentRevision}, ${lesson.sortOrder}, true)
on conflict (topic_id, slug) do update set summary = excluded.summary, content = excluded.content, content_schema_version = excluded.content_schema_version, content_revision = excluded.content_revision, sort_order = excluded.sort_order, published = excluded.published, updated_at = now();`);
    }

    GRAMMAR_EXERCISES.forEach((exercise, index) => {
      const id = `a3000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
      sql.push(`insert into public.grammar_exercises (id, topic_id, lesson_id, exercise_key, type, prompt, payload, answer, explanation, content_schema_version, sort_order, published)
values ('${id}', '${topicIds[exercise.topicSlug]}', '${lessonIds[exercise.lessonSlug]}', '${
        exercise.id
      }', '${exercise.type}', '${exercise.prompt.replace(/'/g, "''")}', '${esc(
        exercise.payload,
      )}'::jsonb, '${esc(exercise.answer)}'::jsonb, '${exercise.explanation.replace(
        /'/g,
        "''",
      )}', ${exercise.contentSchemaVersion}, ${exercise.sortOrder}, true)
on conflict (lesson_id, exercise_key) do update set type = excluded.type, prompt = excluded.prompt, payload = excluded.payload, answer = excluded.answer, explanation = excluded.explanation, content_schema_version = excluded.content_schema_version, sort_order = excluded.sort_order, published = excluded.published, updated_at = now();`);
    });

    sql.push('commit;');
    const body = `${sql.join('\n\n')}\n`;
    expect(body).toContain('insert into public.grammar_topics');
    expect(GRAMMAR_EXERCISES).toHaveLength(40);

    if (process.env.GRAMMAR_WRITE_SEED === '1') {
      writeFileSync(resolve(process.cwd(), 'supabase/migrations/008_grammar_seed.sql'), body);
    }
  });
});
