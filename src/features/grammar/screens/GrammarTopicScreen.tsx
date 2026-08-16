import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GrammarStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen, ProgressBanner } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { GrammarLessonRow } from '@/features/grammar/components';
import {
  grammarErrorMessage,
  useGrammarLessons,
  useGrammarProgress,
  useGrammarTopic,
} from '@/features/grammar/hooks';
import {
  lessonBestScoreRatio,
  pickContinueLessonForTopic,
  topicBestScoreProgressRatio,
} from '@/features/grammar/utils';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function GrammarTopicScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<GrammarStackParamList>>();
  const route = useRoute<RouteProp<GrammarStackParamList, 'GrammarTopic'>>();
  const colors = useAppColors();
  const topicId = route.params.topicId;
  const topicQuery = useGrammarTopic(topicId);
  const lessonsQuery = useGrammarLessons(topicId);
  const progressQuery = useGrammarProgress();
  const openedTracked = useRef(false);

  useEffect(() => {
    if (!topicQuery.data || openedTracked.current) {
      return;
    }
    openedTracked.current = true;
    trackEvent('grammar_topic_opened', { topic_slug: topicQuery.data.slug }).catch(() => undefined);
  }, [topicQuery.data]);

  const lessons = lessonsQuery.data ?? [];
  const topicProgress = (progressQuery.data ?? []).filter((row) => row.topicId === topicId);
  const completedCount = topicProgress.filter((row) => row.status === 'completed').length;
  const hasStarted = topicProgress.some(
    (row) => row.status === 'in_progress' || row.status === 'completed',
  );
  const progressRatio = hasStarted
    ? topicBestScoreProgressRatio(
        lessons.map((lesson) => lesson.id),
        topicProgress,
      )
    : 0;
  const continueTarget = pickContinueLessonForTopic(
    lessons.map((lesson) => ({ id: lesson.id, sortOrder: lesson.sortOrder })),
    topicProgress.map((row) => ({
      lessonId: row.lessonId,
      status: row.status,
      lastActivityAt: row.lastActivityAt,
    })),
  );
  const continueLesson = continueTarget
    ? lessons.find((lesson) => lesson.id === continueTarget.id)
    : undefined;
  const actionLabel = continueLesson
    ? `${hasStarted ? 'Continue' : 'Start'}: ${continueLesson.title}`
    : null;

  const onRetry = () => {
    topicQuery.refetch().catch(() => undefined);
    lessonsQuery.refetch().catch(() => undefined);
    progressQuery.refetch().catch(() => undefined);
  };

  const openLesson = (lessonId: string) => {
    navigation.navigate('GrammarLesson', { topicId, lessonId });
  };

  return (
    <LearningScreen
      testID="grammar-topic"
      header={
        <TopAppHeader
          showBack
          title={topicQuery.data?.title ?? 'Topic'}
          onBackPress={() => navigation.goBack()}
        />
      }
      footer={
        continueLesson && actionLabel ? (
          <BottomActionBar
            label={actionLabel}
            testID="grammar-topic-continue"
            onPress={() => openLesson(continueLesson.id)}
          />
        ) : null
      }
    >
      {topicQuery.isLoading || lessonsQuery.isLoading ? (
        <BrandLoading fill size="md" testID="grammar-topic-loading" />
      ) : null}

      {topicQuery.isError || lessonsQuery.isError ? (
        <View style={styles.stateBlock}>
          <Text style={[styles.body, { color: colors.danger }]}>
            {grammarErrorMessage(topicQuery.error, 'Couldn’t load this topic.')}
          </Text>
          <Pressable accessibilityRole="button" onPress={onRetry}>
            <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {topicQuery.data ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {topicQuery.data.description || 'Learn form, usage, and practical expressions.'}
        </Text>
      ) : null}

      {lessonsQuery.isSuccess && lessons.length > 0 ? (
        <ProgressBanner
          title={`${Math.round(progressRatio * 100)}% complete`}
          subtitle={`${completedCount} of ${lessons.length} lessons completed`}
          progress={progressRatio}
        />
      ) : null}

      {lessonsQuery.isSuccess && lessons.length === 0 ? (
        <Text style={[styles.body, { color: colors.textMuted }]}>No published lessons yet.</Text>
      ) : null}

      {lessonsQuery.isSuccess && lessons.length > 0 ? (
        <Text style={[styles.section, { color: colors.text }]}>Lessons</Text>
      ) : null}

      {lessons.map((lesson, index) => {
        const progress = progressQuery.data?.find((row) => row.lessonId === lesson.id);
        const completed = progress?.status === 'completed';
        const bestScorePercent = Math.round(lessonBestScoreRatio(progress) * 100);
        const active = !completed && continueLesson?.id === lesson.id;

        return (
          <GrammarLessonRow
            key={lesson.id}
            active={active}
            bestScorePercent={progress ? bestScorePercent : null}
            completed={completed}
            index={index}
            lesson={lesson}
            onPress={() => openLesson(lesson.id)}
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
  section: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  stateBlock: {
    gap: themeTokens.spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
});
