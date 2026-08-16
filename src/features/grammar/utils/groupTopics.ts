import {
  GRAMMAR_CATEGORY_BLURBS,
  GRAMMAR_CATEGORY_SLUGS,
  GRAMMAR_CATEGORY_TITLES,
  type GrammarCategorySlug,
} from '@/features/grammar/types/content';

export function groupTopicsByCategory<
  T extends { categorySlug: GrammarCategorySlug; sortOrder: number },
>(topics: readonly T[]): Array<{ slug: GrammarCategorySlug; title: string; topics: T[] }> {
  return GRAMMAR_CATEGORY_SLUGS.map((slug) => ({
    slug,
    title: GRAMMAR_CATEGORY_TITLES[slug],
    topics: topics
      .filter((topic) => topic.categorySlug === slug)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  })).filter((group) => group.topics.length > 0);
}

export function formatCategorySubtitle(
  slug: GrammarCategorySlug,
  status: 'not_started' | 'in_progress' | 'completed',
  completed: number,
  total: number,
): string {
  const optional = slug === 'timeline-planning' ? ' · optional' : '';
  if (status === 'in_progress') {
    return `${completed} of ${total} topics${optional}`;
  }
  if (status === 'completed') {
    return `${total} topics · Completed${optional}`;
  }
  return `${total} topics · ${GRAMMAR_CATEGORY_BLURBS[slug]}${optional}`;
}
