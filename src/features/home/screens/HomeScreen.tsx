import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMainTabSelect } from '@/app/navigation/useMainTabSelect';
import { ScreenScroll } from '@/components/ui/layout';
import { TopAppHeader } from '@/components/ui/navigation';
import { useAuth } from '@/core/auth/AuthProvider';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { useGrammarProgress, useGrammarTopics } from '@/features/grammar/hooks';
import { countCompletedGrammarTopics } from '@/features/grammar/utils';
import { HomeFeatureRow, StreakCard } from '@/features/home/components';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useVocabularyProgress } from '@/features/vocabulary/hooks/useVocabularyProgress';
import { themeTokens, useAppColors } from '@/theme';

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
  const vocabularyProgress = useVocabularyProgress();

  const grammarStatusLabel = useMemo(() => {
    const topics = grammarTopicsQuery.data ?? [];
    const progress = grammarProgressQuery.data ?? [];
    if (!grammarEnabled) {
      return 'Coming soon';
    }
    if (grammarTopicsQuery.isLoading || !grammarTopicsQuery.isSuccess) {
      return '…';
    }
    const lessonsPerTopicById = new Map(topics.map((topic) => [topic.id, topic.lessonCount]));
    const completed = countCompletedGrammarTopics(
      topics.map((topic) => topic.id),
      progress,
      lessonsPerTopicById,
    );
    const total = topics.length;
    return total === 0 ? '0 / 0' : `${completed} / ${total}`;
  }, [
    grammarEnabled,
    grammarProgressQuery.data,
    grammarTopicsQuery.data,
    grammarTopicsQuery.isLoading,
    grammarTopicsQuery.isSuccess,
  ]);

  const vocabularyStatusLabel = vocabularyEnabled
    ? vocabularyProgress.ready
      ? vocabularyProgress.overallLabel
      : '…'
    : 'Coming soon';

  return (
    <ScreenScroll header={<TopAppHeader title={`${greeting}, ${firstName}`} />}>
      <View style={styles.stack}>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          What would you like to learn today?
        </Text>

        <StreakCard />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Learning paths</Text>
        {grammarEnabled ? (
          <HomeFeatureRow
            accessibilityLabel={`Grammar, ${grammarStatusLabel}`}
            icon="book"
            statusLabel={grammarStatusLabel}
            subtitle="Learn practical grammar for work"
            testID="home-open-grammar"
            title="Grammar"
            tone="progress"
            onPress={() => onSelectTab('grammar')}
          />
        ) : (
          <HomeFeatureRow
            accessibilityLabel="Grammar coming soon"
            icon="book"
            statusLabel="Coming soon"
            subtitle="Learn practical grammar for work"
            title="Grammar"
            tone="comingSoon"
          />
        )}
        {vocabularyEnabled ? (
          <HomeFeatureRow
            accessibilityLabel={`Vocabulary, ${vocabularyStatusLabel}`}
            icon="vocabulary"
            statusLabel={vocabularyStatusLabel}
            subtitle="Expressions for real work"
            testID="home-open-vocabulary"
            title="Vocabulary"
            tone="progress"
            onPress={() => onSelectTab('vocabulary')}
          />
        ) : null}
        <HomeFeatureRow
          accessibilityLabel="Interview practice coming soon"
          icon="interview"
          statusLabel="Coming soon"
          subtitle="Practice structured answers"
          title="Interview practice"
          tone="comingSoon"
        />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  stack: {
    gap: themeTokens.spacing['14'],
    width: '100%',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
  },
});
