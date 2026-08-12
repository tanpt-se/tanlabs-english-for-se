import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GrammarStackParamList, MainTabParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen, ProgressBanner } from '@/components/ui/learning';
import { TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { GrammarTopicRow } from '@/features/grammar/components/GrammarTopicRow';
import {
  grammarErrorMessage,
  useGrammarContinueLearning,
  useGrammarProgress,
  useGrammarTopics,
} from '@/features/grammar/hooks';
import { countCompletedGrammarTopics } from '@/features/grammar/utils';
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
  const continueLearning = useGrammarContinueLearning();
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

  const completedTopicCount = useMemo(() => {
    const topics = topicsQuery.data ?? [];
    const progress = progressQuery.data ?? [];
    const lessonsPerTopicById = new Map(topics.map((topic) => [topic.id, topic.lessonCount]));
    return countCompletedGrammarTopics(
      topics.map((topic) => topic.id),
      progress,
      lessonsPerTopicById,
    );
  }, [topicsQuery.data, progressQuery.data]);

  if (!grammarEnabled) {
    return null;
  }

  const topicTotal = topicsQuery.data?.length ?? 0;
  const errorMessage = grammarErrorMessage(
    topicsQuery.error,
    'Couldn’t load topics. Check your connection and try again.',
  );

  return (
    <LearningScreen testID="grammar-home" header={<TopAppHeader title="Grammar" />}>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Master tenses through use
      </Text>

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
          title={`${completedTopicCount} of ${topicTotal} topics completed`}
          subtitle="Five tenses · A2 to C1"
          progress={topicTotal === 0 ? 0 : completedTopicCount / topicTotal}
        />
      ) : null}

      {continueLearning.isReady && continueLearning.target ? (
        <Pressable
          accessibilityLabel="Continue learning"
          accessibilityRole="button"
          testID="grammar-home-continue"
          onPress={() =>
            navigation.navigate('GrammarLesson', {
              topicId: continueLearning.target!.topicId,
              lessonId: continueLearning.target!.lessonId,
            })
          }
          style={({ pressed }) => [
            styles.continueCard,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.primary,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <Text style={[styles.continueEyebrow, { color: colors.primary }]}>Continue learning</Text>
          <Text style={[styles.continueTitle, { color: colors.text }]}>
            {continueLearning.topicTitle ?? 'Grammar topic'}
          </Text>
          <Text style={[styles.continueMeta, { color: colors.textSecondary }]}>
            {continueLearning.lessonTitle ?? 'Next lesson'}
          </Text>
        </Pressable>
      ) : null}

      {topicsQuery.isSuccess && topicsQuery.data.length === 0 ? (
        <Text style={[styles.stateText, { color: colors.textMuted }]}>
          No published topics yet.
        </Text>
      ) : null}

      {topicsQuery.data && topicsQuery.data.length > 0 ? (
        <>
          <Text style={[styles.section, { color: colors.text }]}>Grammar topics</Text>
          <View style={styles.list}>
            {topicsQuery.data.map((topic) => (
              <GrammarTopicRow
                key={topic.id}
                topic={topic}
                onPress={() => navigation.navigate('GrammarTopic', { topicId: topic.id })}
              />
            ))}
          </View>
        </>
      ) : null}
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  continueCard: {
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    gap: themeTokens.spacing.xs,
    paddingHorizontal: themeTokens.spacing['18'],
    paddingVertical: themeTokens.spacing['14'],
  },
  continueEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  continueMeta: {
    fontSize: 14,
    lineHeight: 20,
  },
  continueTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 23,
  },
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
    fontWeight: '600',
    lineHeight: 22,
  },
  stateBlock: {
    gap: themeTokens.spacing.sm,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
});
