import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MainTabParamList, VocabularyStackParamList } from '@/app/navigation/types';
import { AppIcon } from '@/components/ui/brand';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen, ProgressBanner } from '@/components/ui/learning';
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
  const {
    situations,
    totalKnown,
    totalTerms,
    overallLabel,
    overallRatio,
    ready,
    refresh,
    isError,
  } = useVocabularyProgress();
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
      <View style={styles.stack}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Useful expressions for real engineering work.
        </Text>
        {showLoading ? <BrandLoading fill size="md" testID="vocabulary-home-loading" /> : null}
        {!showLoading ? (
          <ProgressBanner
            title={`${overallLabel} known across ${situations.length} situations`}
            subtitle={`${totalKnown} of ${totalTerms} terms marked known`}
            progress={overallRatio}
          />
        ) : null}
      </View>
      <Pressable
        accessibilityLabel={weakCount > 0 ? `Weak items, ${weakCount}` : 'Weak items, none yet'}
        accessibilityRole="button"
        testID="vocabulary-open-weak"
        onPress={() => navigation.navigate('VocabularyWeak')}
        style={({ pressed }) => [
          styles.weakCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.weakCopy}>
          <Text style={[styles.weakTitle, { color: colors.primary }]}>
            Weak items{weakCount > 0 ? ` (${weakCount})` : ''}
          </Text>
          <Text style={[styles.weakHint, { color: colors.textSecondary }]}>
            Retry expressions that need more practice
          </Text>
        </View>
        <View accessible={false} importantForAccessibility="no">
          <AppIcon color={colors.textMuted} name="arrowLeft" size={16} style={styles.weakChevron} />
        </View>
      </Pressable>
      <View style={styles.stack}>
        <Text accessibilityRole="header" style={[styles.section, { color: colors.text }]}>
          Situations
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
  stack: {
    gap: themeTokens.spacing.md,
    width: '100%',
  },
  retry: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 44,
    paddingVertical: 12,
  },
  section: {
    fontSize: themeTokens.typography.size.h3,
    fontWeight: '600',
    lineHeight: themeTokens.typography.lineHeight.h3,
  },
  state: {
    gap: themeTokens.spacing.sm,
  },
  subtitle: {
    fontSize: themeTokens.typography.size.md,
    lineHeight: 22,
  },
  weakCard: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: themeTokens.spacing.md,
    padding: themeTokens.spacing.md,
    width: '100%',
  },
  weakChevron: {
    transform: [{ scaleX: -1 }],
  },
  weakCopy: {
    flex: 1,
    gap: themeTokens.spacing.xs,
    minWidth: 0,
  },
  weakHint: {
    fontSize: themeTokens.typography.size.label,
    fontWeight: '400',
    lineHeight: themeTokens.typography.lineHeight.label,
  },
  weakTitle: {
    fontSize: themeTokens.typography.size.label,
    fontWeight: '500',
    lineHeight: themeTokens.typography.lineHeight.label,
  },
});
