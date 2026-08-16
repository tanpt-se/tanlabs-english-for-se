import {
  GRAMMAR_CATEGORY_SLUGS,
  GRAMMAR_OPTIONAL_TOPIC_SLUGS,
  GRAMMAR_TOPIC_SLUGS,
  type GrammarCategorySlug,
} from '@/features/grammar/types/content';
import {
  formatCategorySubtitle,
  groupTopicsByCategory,
} from '@/features/grammar/utils/groupTopics';
import { lessonGoalText } from '@/features/grammar/utils/lessonGoal';

import packsV2 from '../../../../../supabase/seed/grammar/packs-v2.json';
import coreExpressions from '../../../../../supabase/seed/vocabulary/core-expressions.json';

type PackTopic = (typeof packsV2)[number];

describe('lean grammar & vocabulary v2 inventory', () => {
  it('has 4 categories, 12 topics, 36 lessons, and at most 8 exercises per lesson', () => {
    expect(GRAMMAR_CATEGORY_SLUGS).toHaveLength(4);
    expect(GRAMMAR_TOPIC_SLUGS).toHaveLength(12);
    expect(GRAMMAR_OPTIONAL_TOPIC_SLUGS).toEqual(['progress-earlier-past', 'future-milestones']);
    expect(packsV2).toHaveLength(12);

    const categories = new Set(packsV2.map((topic: PackTopic) => topic.categorySlug));
    expect([...categories].sort()).toEqual([...GRAMMAR_CATEGORY_SLUGS].sort());

    const grouped = groupTopicsByCategory(
      packsV2.map((topic: PackTopic) => ({
        categorySlug: topic.categorySlug as GrammarCategorySlug,
        sortOrder: topic.sortOrder,
        slug: topic.slug,
      })),
    );
    expect(grouped).toHaveLength(4);
    expect(grouped.map((group) => group.slug)).toEqual([...GRAMMAR_CATEGORY_SLUGS]);
    expect(formatCategorySubtitle('core-tenses', 'not_started', 0, 6)).toBe(
      '6 topics · Daily essentials',
    );
    expect(formatCategorySubtitle('core-tenses', 'in_progress', 2, 6)).toBe('2 of 6 topics');
    expect(formatCategorySubtitle('timeline-planning', 'completed', 2, 2)).toBe(
      '2 topics · Completed · optional',
    );

    const lessons = packsV2.flatMap((topic: PackTopic) => topic.lessons);
    expect(lessons).toHaveLength(36);
    for (const topic of packsV2) {
      expect(topic.lessons).toHaveLength(3);
      const byLesson = new Map<string, number>();
      for (const exercise of topic.exercises) {
        byLesson.set(exercise.lessonKey, (byLesson.get(exercise.lessonKey) ?? 0) + 1);
      }
      for (const count of byLesson.values()) {
        expect(count).toBeLessThanOrEqual(8);
      }
    }
  });

  it('has 10 core expressions per situation', () => {
    expect(coreExpressions.situations).toHaveLength(5);
    for (const situation of coreExpressions.situations) {
      expect(situation.items).toHaveLength(10);
    }
    expect(coreExpressions.situations.flatMap((situation) => situation.items)).toHaveLength(50);
  });

  it('keeps lesson anatomy and prefers phrase cores over full sentences', () => {
    for (const topic of packsV2) {
      for (const lesson of topic.lessons) {
        expect(lesson.usage).toMatch(/^Goal:/);
        expect(lessonGoalText(lesson.usage).length).toBeGreaterThan(0);
        expect(lessonGoalText(lesson.usage)).not.toMatch(/^Goal:/i);
        expect(lesson.forms.affirmative.length).toBeGreaterThan(0);
        expect(lesson.exampleSentences.length).toBeGreaterThanOrEqual(3);
        expect(lesson.tips.length).toBeGreaterThanOrEqual(1);
      }
    }
    const cores = coreExpressions.situations.flatMap((situation) => situation.items);
    expect(cores.filter((item) => item.type === 'phrase').length).toBeGreaterThanOrEqual(40);
    expect(cores.every((item) => !/[.!?]$/.test(String(item.term).trim()))).toBe(true);
    expect(cores.every((item) => !/^\/.+\/$/.test(String(item.pronunciation ?? '').trim()))).toBe(
      true,
    );
    expect(
      cores.filter((item) => item.type !== 'word').every((item) => item.countability === 'na'),
    ).toBe(true);
    expect(
      cores.filter((item) => item.type === 'word').every((item) => item.countability !== 'na'),
    ).toBe(true);
  });
});
