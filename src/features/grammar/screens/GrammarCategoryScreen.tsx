import { useNavigation, useRoute } from '@react-navigation/native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GrammarStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen, NumberedLearningRow, ProgressBanner } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import {
  grammarErrorMessage,
  useGrammarProgress,
  useGrammarTopics,
} from '@/features/grammar/hooks';
import {
  GRAMMAR_CATEGORY_TITLES,
  type GrammarCategorySlug,
} from '@/features/grammar/types/content';
import {
  categoryLearningStatus,
  countCompletedLessonsForTopic,
  isTopicFullyCompleted,
  pickFirstIncompleteTopic,
} from '@/features/grammar/utils';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

function isCategorySlug(value: string): value is GrammarCategorySlug {
  return value in GRAMMAR_CATEGORY_TITLES;
}

export function GrammarCategoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GrammarStackParamList>>();
  const route = useRoute<RouteProp<GrammarStackParamList, 'GrammarCategory'>>();
  const colors = useAppColors();
  const categorySlug = isCategorySlug(route.params.categorySlug)
    ? route.params.categorySlug
    : 'core-tenses';
  const topicsQuery = useGrammarTopics();
  const progressQuery = useGrammarProgress();
  const progress = progressQuery.data ?? [];

  const topics = useMemo(
    () =>
      (topicsQuery.data ?? [])
        .filter((topic) => topic.categorySlug === categorySlug)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categorySlug, topicsQuery.data],
  );

  const learning = categoryLearningStatus(
    topics.map((topic) => ({ id: topic.id, lessonCount: topic.lessonCount })),
    progress,
  );
  const continueTopic = pickFirstIncompleteTopic(topics, progress);
  const continueIndex = continueTopic
    ? topics.findIndex((topic) => topic.id === continueTopic.id)
    : -1;

  const onRetry = () => {
    topicsQuery.refetch().catch(() => undefined);
    progressQuery.refetch().catch(() => undefined);
  };

  return (
    <LearningScreen
      testID="grammar-category"
      header={
        <TopAppHeader
          showBack
          title={GRAMMAR_CATEGORY_TITLES[categorySlug]}
          onBackPress={() => navigation.goBack()}
        />
      }
      footer={
        continueTopic ? (
          <BottomActionBar
            label={`Continue with ${continueTopic.title}`}
            testID="grammar-category-continue"
            onPress={() => navigation.navigate('GrammarTopic', { topicId: continueTopic.id })}
          />
        ) : null
      }
    >
      {topicsQuery.isLoading ? (
        <BrandLoading fill size="md" testID="grammar-category-loading" />
      ) : null}

      {topicsQuery.isError ? (
        <View style={styles.stateBlock}>
          <Text style={[styles.body, { color: colors.danger }]}>
            {grammarErrorMessage(topicsQuery.error, 'Couldn’t load this path.')}
          </Text>
          <Pressable accessibilityRole="button" testID="grammar-category-retry" onPress={onRetry}>
            <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {topicsQuery.isSuccess && topics.length > 0 ? (
        <ProgressBanner
          title={`${Math.round(learning.ratio * 100)}% complete`}
          subtitle={`${learning.completed} of ${learning.total} topics completed`}
          progress={learning.ratio}
        />
      ) : null}

      {topicsQuery.isSuccess && topics.length === 0 ? (
        <Text style={[styles.body, { color: colors.textMuted }]}>No topics in this path yet.</Text>
      ) : null}

      {topics.map((topic, index) => {
        const completed = isTopicFullyCompleted(
          topic.lessonCount,
          countCompletedLessonsForTopic(topic.id, progress),
        );
        return (
          <NumberedLearningRow
            key={topic.id}
            index={index + 1}
            title={topic.title}
            subtitle={topic.description}
            tone={completed ? 'completed' : index === continueIndex ? 'active' : 'upcoming'}
            testID={`grammar-topic-${topic.slug}`}
            onPress={() => navigation.navigate('GrammarTopic', { topicId: topic.id })}
          />
        );
      })}
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  retry: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 44,
    paddingVertical: 12,
  },
  stateBlock: {
    gap: themeTokens.spacing.sm,
  },
});
