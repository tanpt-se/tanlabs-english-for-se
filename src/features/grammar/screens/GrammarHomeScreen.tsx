import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GrammarStackParamList, MainTabParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen, PathStatusCard, ProgressBanner } from '@/components/ui/learning';
import { TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import {
  grammarErrorMessage,
  useGrammarProgress,
  useGrammarTopics,
} from '@/features/grammar/hooks';
import { GRAMMAR_CATEGORY_TITLES } from '@/features/grammar/types/content';
import {
  categoryLearningStatus,
  formatCategorySubtitle,
  groupTopicsByCategory,
  GRAMMAR_LESSONS_PER_TOPIC,
} from '@/features/grammar/utils';
import { themeTokens, useAppColors } from '@/theme';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<GrammarStackParamList, 'GrammarHome'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function GrammarHomeScreen() {
  const navigation = useNavigation<Nav>();
  const flags = useFeatureFlags();
  const colors = useAppColors();
  const grammarEnabled = flags.data?.grammar === true;
  const topicsQuery = useGrammarTopics();
  const progressQuery = useGrammarProgress();
  const openedTracked = useRef(false);

  useEffect(() => {
    if (!grammarEnabled) {
      navigation.navigate('Home');
      return;
    }
    if (!openedTracked.current) {
      openedTracked.current = true;
      trackEvent('grammar_opened').catch(() => undefined);
    }
  }, [grammarEnabled, navigation]);

  const groups = useMemo(() => groupTopicsByCategory(topicsQuery.data ?? []), [topicsQuery.data]);

  const overall = useMemo(
    () =>
      categoryLearningStatus(
        (topicsQuery.data ?? []).map((topic) => ({
          id: topic.id,
          lessonCount: topic.lessonCount,
        })),
        progressQuery.data ?? [],
      ),
    [topicsQuery.data, progressQuery.data],
  );

  if (!grammarEnabled) {
    return null;
  }

  const topicTotal = topicsQuery.data?.length ?? 0;
  const pathCount = groups.length;
  const lessonsEach =
    topicsQuery.data?.reduce(
      (min, topic) => Math.min(min, topic.lessonCount || GRAMMAR_LESSONS_PER_TOPIC),
      GRAMMAR_LESSONS_PER_TOPIC,
    ) ?? GRAMMAR_LESSONS_PER_TOPIC;
  const errorMessage = grammarErrorMessage(
    topicsQuery.error,
    'Couldn’t load topics. Check your connection and try again.',
  );

  return (
    <LearningScreen testID="grammar-home" header={<TopAppHeader title="Grammar" />}>
      {topicsQuery.isLoading ? <BrandLoading fill size="md" testID="grammar-home-loading" /> : null}

      {topicsQuery.isError ? (
        <View style={styles.stateBlock}>
          <Text style={[styles.stateText, { color: colors.danger }]}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry"
            testID="grammar-home-retry"
            onPress={() => {
              topicsQuery.refetch().catch(() => undefined);
              progressQuery.refetch().catch(() => undefined);
            }}
          >
            <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {topicsQuery.isSuccess ? (
        <ProgressBanner
          title={`${overall.completed} of ${topicTotal} topics completed`}
          subtitle={
            pathCount > 0
              ? `${pathCount} learning path${
                  pathCount === 1 ? '' : 's'
                } · ${lessonsEach} lessons each`
              : `${lessonsEach} lessons each`
          }
          progress={overall.ratio}
        />
      ) : null}

      {topicsQuery.isSuccess && topicsQuery.data.length === 0 ? (
        <Text style={[styles.stateText, { color: colors.textMuted }]}>
          No published topics yet.
        </Text>
      ) : null}

      {groups.length > 0 ? (
        <View style={styles.list}>
          <Text style={[styles.section, { color: colors.text }]}>Grammar categories</Text>
          {groups.map((group) => {
            const learning = categoryLearningStatus(
              group.topics.map((topic) => ({ id: topic.id, lessonCount: topic.lessonCount })),
              progressQuery.data ?? [],
            );
            return (
              <PathStatusCard
                key={group.slug}
                title={GRAMMAR_CATEGORY_TITLES[group.slug]}
                status={learning.status}
                subtitle={formatCategorySubtitle(
                  group.slug,
                  learning.status,
                  learning.completed,
                  learning.total,
                )}
                progress={learning.ratio}
                testID={`grammar-category-${group.slug}`}
                onPress={() => navigation.navigate('GrammarCategory', { categorySlug: group.slug })}
              />
            );
          })}
        </View>
      ) : null}
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: themeTokens.spacing['14'],
  },
  retry: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 44,
    paddingVertical: 12,
  },
  section: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  stateBlock: {
    gap: themeTokens.spacing.sm,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
