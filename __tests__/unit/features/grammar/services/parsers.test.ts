import { GrammarDomainError } from '@/features/grammar/services/errors';
import {
  parseGrammarAttempt,
  parseLessonProgress,
  parsePublishedExercise,
  parsePublishedLesson,
  parsePublishedTopic,
} from '@/features/grammar/services/parsers';

import { FIXTURE_LESSON } from '../../../../helpers/grammarFixtures';

jest.mock('@/core/monitoring/crashlytics', () => ({
  recordError: jest.fn(async () => undefined),
}));

describe('grammar content parsers', () => {
  it('parses published topics and rejects unpublished/invalid rows', () => {
    expect(
      parsePublishedTopic({
        id: 't1',
        slug: 'present-simple',
        title: 'Present Simple',
        description: 'Habits',
        sort_order: 1,
        published: true,
      }),
    ).toMatchObject({ slug: 'present-simple', sortOrder: 1, lessonCount: 4 });

    expect(
      parsePublishedTopic({
        id: 't1',
        slug: 'present-simple',
        title: 'Present Simple',
        description: 'Habits',
        sort_order: 1,
        lesson_count: 3,
        published: true,
      }),
    ).toMatchObject({ lessonCount: 3 });

    expect(() =>
      parsePublishedTopic({
        id: 't1',
        slug: 'present-simple',
        title: 'Present Simple',
        description: 'Habits',
        sort_order: 1,
        published: false,
      }),
    ).toThrow(GrammarDomainError);
  });

  it('parses lesson JSON and exercise payloads from inventory shapes', () => {
    const lesson = FIXTURE_LESSON;
    expect(
      parsePublishedLesson({
        id: 'l1',
        topic_id: 't1',
        slug: lesson.slug,
        title: lesson.title,
        description: lesson.description,
        level: lesson.level,
        content: lesson.content,
        content_schema_version: 1,
        content_revision: 1,
        sort_order: 1,
        published: true,
      }),
    ).toMatchObject({ slug: lesson.slug, level: 'A2', contentRevision: 1 });

    expect(
      parsePublishedExercise({
        id: 'e1',
        topic_id: 't1',
        lesson_id: 'l1',
        exercise_key: 'ps-x1',
        type: 'multiple_choice',
        prompt: 'Choose',
        payload: {
          options: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
          ],
        },
        answer: { optionId: 'a' },
        explanation: 'Because',
        content_schema_version: 1,
        sort_order: 1,
        published: true,
      }),
    ).toMatchObject({ exerciseKey: 'ps-x1', type: 'multiple_choice' });

    expect(
      parseLessonProgress({
        lesson_id: 'l1',
        topic_id: 't1',
        status: 'completed',
        best_score: 80,
        last_score: 70,
        last_activity_at: null,
        completed_at: '2026-08-11T00:00:00Z',
      }),
    ).toMatchObject({ status: 'completed', bestScore: 80 });
  });

  it('rejects invalid schemas, levels, and progress statuses', () => {
    expect(() =>
      parsePublishedTopic({
        id: 't1',
        slug: 'present-simple-a2',
        title: 'Present Simple',
        description: 'Habits',
        sort_order: 1,
        published: true,
      }),
    ).toThrow(/slug/i);

    expect(() =>
      parsePublishedLesson({
        id: 'l1',
        topic_id: 't1',
        slug: 'x',
        title: 's',
        description: 's',
        level: 'C2',
        content: FIXTURE_LESSON.content,
        content_schema_version: 1,
        content_revision: 1,
        sort_order: 1,
        published: true,
      }),
    ).toThrow(/level/i);

    expect(() =>
      parsePublishedLesson({
        id: 'l1',
        topic_id: 't1',
        slug: 'x',
        title: 's',
        description: 's',
        level: 'A2',
        content: FIXTURE_LESSON.content,
        content_schema_version: 99,
        content_revision: 1,
        sort_order: 1,
        published: true,
      }),
    ).toThrow(/schema/i);

    expect(() =>
      parseLessonProgress({
        lesson_id: 'l1',
        topic_id: 't1',
        status: 'unknown',
        best_score: 10,
        last_score: 10,
        last_activity_at: null,
        completed_at: null,
      }),
    ).toThrow(/status/i);
  });

  it('parses grammar attempt rows into Result session shape', () => {
    expect(
      parseGrammarAttempt({
        client_attempt_id: '11111111-1111-4111-8111-111111111111',
        topic_id: 't1',
        lesson_id: 'l1',
        content_revision: 2,
        correct_count: 14,
        total_count: 18,
        score: 78,
        answers: [{ exerciseId: 'e1', correct: true, selectedIds: ['a1'] }],
        started_at: '2026-01-01T10:00:00.000Z',
        completed_at: '2026-01-01T10:18:00.000Z',
      }),
    ).toMatchObject({
      clientAttemptId: '11111111-1111-4111-8111-111111111111',
      score: 78,
      completed: true,
      correctCount: 14,
      totalCount: 18,
    });
  });

  it('rejects malformed exercise and attempt payloads', () => {
    expect(() =>
      parsePublishedExercise({
        ...{
          id: 'e1',
          topic_id: 't1',
          lesson_id: 'l1',
          exercise_key: 'ps-x1',
          type: 'multiple_choice',
          prompt: 'Choose',
          payload: { options: [{ id: 'a', label: 'A' }] },
          answer: { optionId: 'a' },
          explanation: 'Because',
          content_schema_version: 1,
          sort_order: 1,
        },
        published: false,
      }),
    ).toThrow(/Unpublished exercise/);

    expect(() =>
      parsePublishedExercise({
        id: 'e1',
        topic_id: 't1',
        lesson_id: 'l1',
        exercise_key: 'ps-x1',
        type: 'multiple_choice',
        prompt: 'Choose',
        payload: { options: [{ id: 'a', label: 'A' }] },
        answer: { optionId: 'a' },
        explanation: 'Because',
        content_schema_version: 99,
        sort_order: 1,
        published: true,
      }),
    ).toThrow(/schema/i);

    expect(() =>
      parseGrammarAttempt({
        client_attempt_id: '11111111-1111-4111-8111-111111111111',
        topic_id: 't1',
        lesson_id: 'l1',
        content_revision: 1,
        correct_count: 1,
        total_count: 2,
        score: 50,
        answers: 'bad',
        started_at: '2026-01-01T10:00:00.000Z',
        completed_at: '2026-01-01T10:18:00.000Z',
      }),
    ).toThrow(/attempt answers/i);

    expect(() =>
      parseGrammarAttempt({
        client_attempt_id: '11111111-1111-4111-8111-111111111111',
        topic_id: 't1',
        lesson_id: 'l1',
        content_revision: 1,
        correct_count: 1,
        total_count: 2,
        score: 50,
        answers: [{}],
        started_at: '2026-01-01T10:00:00.000Z',
        completed_at: '2026-01-01T10:18:00.000Z',
      }),
    ).toThrow(/answers\[0\]\.exerciseId/);
  });

  it('rejects invalid ints, levels, unpublished lessons, and empty strings', () => {
    expect(() =>
      parsePublishedTopic({
        id: 't1',
        slug: 'present-simple',
        title: 'Present Simple',
        description: 'Habits',
        sort_order: 1.5,
        published: true,
      }),
    ).toThrow(/sort_order/);

    expect(() =>
      parsePublishedTopic({
        id: '',
        slug: 'present-simple',
        title: 'Present Simple',
        description: 'Habits',
        sort_order: 1,
        published: true,
      }),
    ).toThrow(/topic.id/);

    expect(() =>
      parsePublishedLesson({
        id: 'l1',
        topic_id: 't1',
        slug: 'a2',
        title: 'A2',
        description: 'x',
        level: 'A2',
        content: FIXTURE_LESSON.content,
        content_schema_version: 1,
        content_revision: 1,
        sort_order: 1,
        published: false,
      }),
    ).toThrow(/Unpublished lesson/);

    expect(() =>
      parsePublishedLesson({
        id: 'l1',
        topic_id: 't1',
        slug: 'a2',
        title: 'A2',
        description: 'x',
        level: 'Z9',
        content: FIXTURE_LESSON.content,
        content_schema_version: 1,
        content_revision: 1,
        sort_order: 1,
        published: true,
      }),
    ).toThrow(/Invalid lesson level/);

    expect(() =>
      parseLessonProgress({
        lesson_id: 'l1',
        topic_id: 't1',
        status: 'completed',
        best_score: 1.5,
        last_score: 80,
        last_activity_at: null,
        completed_at: null,
      }),
    ).toThrow();
  });
});
