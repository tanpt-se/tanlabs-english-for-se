import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VocabularyStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { resolveLocalItemLabel } from '@/features/vocabulary/data/localPackCatalog';
import { useVocabularySituations, useVocabularyWeakProgress } from '@/features/vocabulary/hooks';
import { themeTokens, useAppColors } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function WeakItemsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyStackParamList>>();
  const flags = useFeatureFlags();
  const colors = useAppColors();
  const vocabularyEnabled = flags.data?.vocabulary === true;
  const weakQuery = useVocabularyWeakProgress();
  const situationsQuery = useVocabularySituations();
  const weak = weakQuery.data ?? [];
  const firstSituationId =
    weak[0]?.itemId.split(':')[0] ??
    situationsQuery.data?.[0]?.slug ??
    situationsQuery.data?.[0]?.id;

  useEffect(() => {
    if (!vocabularyEnabled) {
      navigation.navigate('VocabularyHome');
    }
  }, [navigation, vocabularyEnabled]);

  useEffect(() => {
    if (vocabularyEnabled) {
      trackEvent('vocabulary_weak_opened').catch(() => undefined);
    }
  }, [vocabularyEnabled]);

  if (!vocabularyEnabled) {
    return null;
  }

  const onPractice = () => {
    if (!firstSituationId) {
      return;
    }
    navigation.navigate('VocabularyPracticeFlow', {
      screen: 'VocabularyPractice',
      params: { situationId: firstSituationId, mode: 'weak' },
    });
  };

  return (
    <LearningScreen
      testID="vocabulary-weak"
      header={<TopAppHeader showBack title="Weak items" onBackPress={() => navigation.goBack()} />}
      footer={
        weak.length > 0 ? (
          <BottomActionBar
            label={`Practice weak (${Math.min(weak.length, 10)})`}
            testID="vocabulary-weak-practice"
            onPress={onPractice}
          />
        ) : null
      }
    >
      {weakQuery.isLoading ? (
        <BrandLoading fill size="md" testID="vocabulary-weak-loading" />
      ) : null}

      {weakQuery.isError ? (
        <View style={styles.state}>
          <Text style={[styles.body, { color: colors.danger }]}>
            Couldn’t load weak expressions.
          </Text>
          <Pressable
            accessibilityLabel="Retry"
            accessibilityRole="button"
            testID="vocabulary-weak-retry"
            onPress={() => weakQuery.refetch()}
          >
            <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!weakQuery.isLoading && weak.length === 0 ? (
        <Text style={[styles.body, { color: colors.textMuted }]}>
          No weak expressions yet. Complete a practice session to build this list.
        </Text>
      ) : null}

      <View style={styles.list}>
        {weak.map((row) => {
          const label = resolveLocalItemLabel(row.itemId);
          return (
            <View
              key={row.itemId}
              accessible
              accessibilityLabel={`${label}, ${row.incorrectCount} incorrect, ${row.correctCount} correct`}
              style={[styles.row, { backgroundColor: colors.surface }]}
              testID={`vocabulary-weak-row-${row.itemId}`}
            >
              <Text style={[styles.term, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {row.incorrectCount} incorrect · {row.correctCount} correct
              </Text>
            </View>
          );
        })}
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
    gap: themeTokens.spacing.sm,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  retry: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 44,
    marginTop: themeTokens.spacing.sm,
    paddingVertical: 12,
  },
  row: {
    borderRadius: themeTokens.radius.card,
    gap: 4,
    minHeight: 44,
    paddingHorizontal: themeTokens.spacing['14'],
    paddingVertical: themeTokens.spacing['12'],
  },
  state: {
    gap: themeTokens.spacing.sm,
  },
  term: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
