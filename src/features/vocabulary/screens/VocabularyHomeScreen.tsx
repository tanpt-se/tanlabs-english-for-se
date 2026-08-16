import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MainTabParamList, VocabularyStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen, PathStatusCard, ProgressBanner } from '@/components/ui/learning';
import { TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { SituationCard } from '@/features/vocabulary/components';
import { useVocabularyWeakProgress } from '@/features/vocabulary/hooks';
import { useVocabularyProgress } from '@/features/vocabulary/hooks/useVocabularyProgress';
import { themeTokens, useAppColors } from '@/theme';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<VocabularyStackParamList, 'VocabularyHome'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function VocabularyHomeScreen() {
  const navigation = useNavigation<Nav>();
  const flags = useFeatureFlags();
  const colors = useAppColors();
  const vocabularyEnabled = flags.data?.vocabulary === true;
  const { situations, ready, refresh, isError, libraryTotal, libraryKnown, libraryRatio } =
    useVocabularyProgress();
  const weakQuery = useVocabularyWeakProgress();
  const weakCount = weakQuery.data?.length ?? 0;

  useEffect(() => {
    if (!vocabularyEnabled) {
      navigation.navigate('Home');
    }
  }, [navigation, vocabularyEnabled]);

  useEffect(() => {
    if (vocabularyEnabled) {
      trackEvent('vocabulary_opened').catch(() => undefined);
    }
  }, [vocabularyEnabled]);

  if (!vocabularyEnabled) {
    return null;
  }

  const showLoading = !ready;
  const showEmpty = ready && !isError && situations.length === 0;
  const situationCount = situations.length;
  const knownCount =
    typeof libraryKnown === 'number' && Number.isFinite(libraryKnown) ? libraryKnown : 0;
  const totalCount =
    typeof libraryTotal === 'number' && Number.isFinite(libraryTotal) ? libraryTotal : 0;
  const ratio =
    typeof libraryRatio === 'number' && Number.isFinite(libraryRatio) ? libraryRatio : 0;
  const libraryStatus = ratio <= 0 ? 'not_started' : ratio >= 1 ? 'completed' : 'in_progress';
  const librarySubtitle =
    totalCount > 0 ? `Browse ${totalCount} reference terms` : 'Browse the reference library';
  const weakRatio = totalCount > 0 ? Math.min(1, weakCount / totalCount) : weakCount > 0 ? 1 : 0;

  const retryCatalog = () => {
    refresh().catch(() => undefined);
    weakQuery.refetch().catch(() => undefined);
  };

  return (
    <LearningScreen
      testID="vocabulary-home"
      contentGap={24}
      header={<TopAppHeader title="Vocabulary" />}
    >
      {showLoading ? <BrandLoading fill size="md" testID="vocabulary-home-loading" /> : null}
      {!showLoading ? (
        <ProgressBanner
          title={`${knownCount} of ${totalCount} terms learned`}
          subtitle={`${situationCount} workplace situation${
            situationCount === 1 ? '' : 's'
          } · Engineering English`}
          progress={ratio}
        />
      ) : null}

      <View style={styles.stack}>
        <Text accessibilityRole="header" style={[styles.section, { color: colors.text }]}>
          Vocabulary situations
        </Text>
        {isError || showEmpty ? (
          <View style={styles.state}>
            <Text style={[styles.body, { color: isError ? colors.danger : colors.textMuted }]}>
              {isError ? 'Couldn’t load situations.' : 'No situations available yet.'}
            </Text>
            <Pressable
              accessibilityLabel="Retry"
              accessibilityRole="button"
              testID="vocabulary-home-retry"
              onPress={retryCatalog}
            >
              <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.list}>
          {situations.map((situation) => (
            <SituationCard
              key={situation.slug}
              testID={`vocabulary-situation-${situation.slug}`}
              title={situation.title}
              description={situation.description}
              progress={situation.progressLabel}
              progressRatio={situation.progressRatio}
              onPress={() =>
                navigation.navigate('VocabularySituation', { situationId: situation.slug })
              }
            />
          ))}
        </View>
      </View>

      <PathStatusCard
        title="Library"
        status={libraryStatus}
        subtitle={librarySubtitle}
        progress={ratio}
        testID="vocabulary-open-library"
        onPress={() => navigation.navigate('VocabularyLibrary', {})}
      />
      <PathStatusCard
        title={weakCount > 0 ? `Weak items (${weakCount})` : 'Weak items'}
        status={weakCount > 0 ? 'in_progress' : 'not_started'}
        subtitle="Retry expressions that need more practice"
        progress={weakRatio}
        testID="vocabulary-open-weak"
        onPress={() => navigation.navigate('VocabularyWeak')}
      />
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    gap: themeTokens.spacing['12'],
  },
  retry: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 44,
    paddingVertical: 12,
  },
  section: {
    fontSize: themeTokens.typography.size.md,
    fontWeight: '700',
    lineHeight: 22,
  },
  stack: {
    gap: themeTokens.spacing.md,
    width: '100%',
  },
  state: {
    gap: themeTokens.spacing.sm,
  },
});
