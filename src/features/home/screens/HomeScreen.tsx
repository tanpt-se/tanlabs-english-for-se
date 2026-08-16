import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MainTabParamList } from '@/app/navigation/types';
import { useMainTabSelect } from '@/app/navigation/useMainTabSelect';
import { ScreenScroll } from '@/components/ui/layout';
import { TopAppHeader } from '@/components/ui/navigation';
import { useAuth } from '@/core/auth/AuthProvider';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import {
  useGrammarContinueLearning,
  useGrammarProgress,
  useGrammarTopics,
} from '@/features/grammar/hooks';
import { countCompletedGrammarTopics } from '@/features/grammar/utils';
import {
  ContinueLearningCard,
  HomeFeatureRow,
  ReviewNeededCard,
  StreakCard,
} from '@/features/home/components';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useVocabularyWeakProgress } from '@/features/vocabulary/hooks';
import { useVocabularyProgress } from '@/features/vocabulary/hooks/useVocabularyProgress';
import { themeTokens, useAppColors } from '@/theme';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

function daytimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const onSelectTab = useMainTabSelect();
  const { profile: authProfile } = useAuth();
  const { data: profile } = useProfile();
  const flags = useFeatureFlags();
  const current = profile ?? authProfile;
  const colors = useAppColors();
  const firstName = current?.display_name?.trim().split(/\s+/)[0] ?? 'there';
  const greeting = useMemo(() => daytimeGreeting(), []);
  const grammarEnabled = flags.data?.grammar === true;
  const vocabularyEnabled = flags.data?.vocabulary === true;

  const grammarTopicsQuery = useGrammarTopics();
  const grammarProgressQuery = useGrammarProgress();
  const grammarContinue = useGrammarContinueLearning();
  const vocabularyProgress = useVocabularyProgress();
  const weakQuery = useVocabularyWeakProgress();
  const weakCount = weakQuery.data?.length ?? 0;

  const grammarCompleted = useMemo(() => {
    const topics = grammarTopicsQuery.data ?? [];
    const progress = grammarProgressQuery.data ?? [];
    if (!grammarEnabled) {
      return { label: 'Coming soon', ratio: 0 };
    }
    if (grammarTopicsQuery.isLoading || !grammarTopicsQuery.isSuccess) {
      return { label: '…', ratio: 0 };
    }
    const lessonsPerTopicById = new Map(topics.map((topic) => [topic.id, topic.lessonCount]));
    const completed = countCompletedGrammarTopics(
      topics.map((topic) => topic.id),
      progress,
      lessonsPerTopicById,
    );
    const total = topics.length;
    return {
      label: `${completed} / ${total} topics`,
      ratio: total === 0 ? 0 : completed / total,
    };
  }, [
    grammarEnabled,
    grammarProgressQuery.data,
    grammarTopicsQuery.data,
    grammarTopicsQuery.isLoading,
    grammarTopicsQuery.isSuccess,
  ]);

  const vocabularyStatus = vocabularyEnabled
    ? vocabularyProgress.ready
      ? {
          label: `${vocabularyProgress.libraryKnown} / ${vocabularyProgress.libraryTotal} terms`,
          ratio: vocabularyProgress.libraryRatio,
        }
      : { label: '…', ratio: 0 }
    : { label: 'Coming soon', ratio: 0 };

  const continueTarget = grammarEnabled && grammarContinue.isReady ? grammarContinue.target : null;
  const continuePosition = grammarContinue.lessonPosition;

  return (
    <ScreenScroll header={<TopAppHeader title={`${greeting}, ${firstName}`} />}>
      <View style={styles.stack}>
        {continueTarget ? (
          <ContinueLearningCard
            lessonTitle={grammarContinue.lessonTitle ?? 'Next lesson'}
            progressLabel={
              continuePosition
                ? `${continuePosition.current} of ${continuePosition.total} lessons`
                : 'Continue'
            }
            subtitle={`${grammarContinue.topicTitle ?? 'Grammar topic'} · Grammar`}
            onPress={() =>
              navigation.navigate('Grammar', {
                screen: 'GrammarLesson',
                params: {
                  topicId: continueTarget.topicId,
                  lessonId: continueTarget.lessonId,
                },
              })
            }
          />
        ) : null}

        <StreakCard />

        <View style={styles.paths}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Learning paths</Text>
          {grammarEnabled ? (
            <HomeFeatureRow
              accessibilityLabel={`Grammar, ${grammarCompleted.label}`}
              icon="book"
              progress={grammarCompleted.ratio}
              statusLabel={grammarCompleted.label}
              testID="home-open-grammar"
              title="Grammar"
              tone="progress"
              onPress={() => onSelectTab('grammar')}
            />
          ) : (
            <HomeFeatureRow
              accessibilityLabel="Grammar coming soon"
              icon="book"
              progress={0}
              statusLabel="Coming soon"
              title="Grammar"
              tone="comingSoon"
            />
          )}
          {vocabularyEnabled ? (
            <HomeFeatureRow
              accessibilityLabel={`Vocabulary, ${vocabularyStatus.label}`}
              icon="vocabulary"
              progress={vocabularyStatus.ratio}
              statusLabel={vocabularyStatus.label}
              testID="home-open-vocabulary"
              title="Vocabulary"
              tone="progress"
              onPress={() => onSelectTab('vocabulary')}
            />
          ) : (
            <HomeFeatureRow
              accessibilityLabel="Vocabulary coming soon"
              icon="vocabulary"
              progress={0}
              statusLabel="Coming soon"
              title="Vocabulary"
              tone="comingSoon"
            />
          )}
          <HomeFeatureRow
            accessibilityLabel="Interview practice coming soon"
            icon="interview"
            progress={0}
            statusLabel="Coming soon"
            title="Interview practice"
            tone="comingSoon"
          />
        </View>

        {vocabularyEnabled && weakCount > 0 ? (
          <ReviewNeededCard
            count={weakCount}
            onPress={() =>
              navigation.navigate('Vocabulary', {
                screen: 'VocabularyWeak',
              })
            }
          />
        ) : null}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  paths: {
    gap: themeTokens.spacing['12'],
    width: '100%',
  },
  sectionTitle: {
    fontSize: themeTokens.typography.size.md,
    fontWeight: '700',
    lineHeight: 22,
  },
  stack: {
    gap: themeTokens.spacing.md,
    width: '100%',
  },
});
