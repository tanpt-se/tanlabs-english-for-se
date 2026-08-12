import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  GRAMMAR_EXERCISES,
  GRAMMAR_LESSONS,
  GRAMMAR_TOPICS,
} from '@/features/grammar/data/seedInventory';

describe('grammar seed SQL bootstrap', () => {
  it('keeps the app inventory empty and ships shared-topic SQL template in 008', () => {
    expect(GRAMMAR_TOPICS).toEqual([]);
    expect(GRAMMAR_LESSONS).toEqual([]);
    expect(GRAMMAR_EXERCISES).toEqual([]);

    const packs = JSON.parse(
      readFileSync(resolve(process.cwd(), 'supabase/seed/grammar/packs.json'), 'utf8'),
    ) as Array<{
      slug: string;
      level?: string;
      lessons: Array<{ level: string }>;
      exercises: unknown[];
    }>;
    expect(packs).toHaveLength(13);
    expect(packs.every((pack) => pack.level == null)).toBe(true);
    expect(packs.every((pack) => pack.lessons.length === 4)).toBe(true);
    expect(
      packs.every((pack) =>
        ['A2', 'B1', 'B2', 'C1'].every(
          (level) => pack.lessons.filter((lesson) => lesson.level === level).length === 1,
        ),
      ),
    ).toBe(true);
    expect(packs.every((pack) => pack.exercises.length === 72)).toBe(true);

    const body = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/008_grammar_seed.sql'),
      'utf8',
    );
    expect(body).toContain('delete from public.grammar_topics');
    expect(body).toContain('insert into public.grammar_topics');
    expect(body).toContain('drop column if exists level');
    expect(body).toContain(
      'insert into public.grammar_lessons (id, topic_id, slug, title, description, level',
    );
    expect(body).toContain("'A2 · Habits'");
    for (const pack of packs) {
      expect(body).toContain(`'${pack.slug}'`);
    }
    const topicInserts = body.match(/insert into public\.grammar_topics/g) ?? [];
    const lessonInserts = body.match(/insert into public\.grammar_lessons/g) ?? [];
    const exerciseInserts = body.match(/insert into public\.grammar_exercises/g) ?? [];
    expect(topicInserts).toHaveLength(13);
    expect(lessonInserts).toHaveLength(52);
    expect(exerciseInserts).toHaveLength(936);
  });

  it('keeps B1–C1 exercise payloads original versus A2', () => {
    const packs = JSON.parse(
      readFileSync(resolve(process.cwd(), 'supabase/seed/grammar/packs.json'), 'utf8'),
    ) as Array<{
      slug: string;
      lessons: Array<{ key: string; level: string; exampleSentences: [string, string][] }>;
      exercises: Array<{
        id: string;
        lessonKey: string;
        prompt: string;
        payload: unknown;
        answer: unknown;
      }>;
    }>;

    for (const pack of packs) {
      const a2Sentences = new Set(
        pack.lessons
          .filter((lesson) => lesson.level === 'A2')
          .flatMap((lesson) =>
            lesson.exampleSentences.map(([, sentence]) => sentence.trim().toLowerCase()),
          ),
      );
      for (const lesson of pack.lessons.filter((row) => row.level !== 'A2')) {
        for (const [, sentence] of lesson.exampleSentences) {
          expect(a2Sentences.has(sentence.trim().toLowerCase())).toBe(false);
        }
      }

      const a2Exercises = pack.exercises.filter((exercise) => exercise.lessonKey.startsWith('a2-'));
      for (const exercise of pack.exercises.filter((row) => !row.lessonKey.startsWith('a2-'))) {
        const cloned = a2Exercises.some(
          (a2) =>
            JSON.stringify(a2.payload) === JSON.stringify(exercise.payload) &&
            JSON.stringify(a2.answer) === JSON.stringify(exercise.answer),
        );
        expect(cloned).toBe(false);
      }
    }
  });
});
