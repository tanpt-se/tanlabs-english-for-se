import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MainTabParamList, VocabularyStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen, ProgressBanner } from '@/components/ui/learning';
import { TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { SituationCard } from '@/features/vocabulary/components';
import { isVocabularyLocalPackPreview } from '@/features/vocabulary/data/mockCatalog';
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
  const { situations, totalKnown, totalTerms, overallLabel, overallRatio, ready, refresh } =
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
  const showEmpty = ready && situations.length === 0;

  return (
    <LearningScreen testID="vocabulary-home" header={<TopAppHeader title="Vocabulary" />}>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Useful expressions for real engineering work.
      </Text>
      {showLoading ? <BrandLoading fill size="md" testID="vocabulary-home-loading" /> : null}
      {!showLoading ? (
        <ProgressBanner
          title={`${overallLabel} known across ${situations.length} situations`}
          subtitle={
            isVocabularyLocalPackPreview()
              ? `${totalKnown} of ${totalTerms} terms marked known (local preview)`
              : `${totalKnown} of ${totalTerms} terms marked known`
          }
          progress={overallRatio}
          tone="soft"
        />
      ) : null}
      <Pressable
        accessibilityLabel={weakCount > 0 ? `Weak items, ${weakCount}` : 'Weak items, none yet'}
        accessibilityRole="button"
        testID="vocabulary-open-weak"
        onPress={() => navigation.navigate('VocabularyWeak')}
        style={({ pressed }) => [styles.weakLink, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={[styles.weakTitle, { color: colors.primary }]}>
          Weak items{weakCount > 0 ? ` (${weakCount})` : ''}
        </Text>
        <Text style={[styles.weakHint, { color: colors.textSecondary }]}>
          Retry expressions that need more practice
        </Text>
      </Pressable>
      <Text accessibilityRole="header" style={[styles.section, { color: colors.text }]}>
        Situations
      </Text>
      {showEmpty ? (
        <View style={styles.state}>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            No situations available yet.
          </Text>
          <Pressable
            accessibilityLabel="Retry"
            accessibilityRole="button"
            testID="vocabulary-home-retry"
            onPress={() => {
              refresh().catch(() => undefined);
              weakQuery.refetch().catch(() => undefined);
            }}
          >
            <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.list}>
        {situations.map((situation) => (
          <SituationCard
            key={situation.id}
            testID={`vocabulary-situation-${situation.id}`}
            title={situation.title}
            description={situation.description}
            progress={situation.progressLabel}
            progressRatio={situation.progressRatio}
            onPress={() =>
              navigation.navigate('VocabularySituation', { situationId: situation.id })
            }
          />
        ))}
      </View>
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
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
  state: {
    gap: themeTokens.spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  weakHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  weakLink: {
    gap: 2,
  },
  weakTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
