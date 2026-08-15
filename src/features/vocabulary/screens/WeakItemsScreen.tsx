import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VocabularyStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { trackEvent } from '@/core/analytics/events';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { useVocabularyWeakProgress } from '@/features/vocabulary/hooks';
import { SESSION_TARGET } from '@/features/vocabulary/utils/composeSession';
import { themeTokens, useAppColors } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function WeakItemsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyStackParamList>>();
  const flags = useFeatureFlags();
  const colors = useAppColors();
  const vocabularyEnabled = flags.data?.vocabulary === true;
  const weakQuery = useVocabularyWeakProgress();
  const weak = weakQuery.data ?? [];

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
    if (weak.length === 0) {
      return;
    }
    navigation.navigate('VocabularyPracticeFlow', {
      screen: 'VocabularyPractice',
      params: { situationId: 'weak', mode: 'weak' },
    });
  };

  return (
    <LearningScreen
      testID="vocabulary-weak"
      contentGap={16}
      header={<TopAppHeader showBack title="Weak items" onBackPress={() => navigation.goBack()} />}
      footer={
        weak.length > 0 ? (
          <BottomActionBar
            label={`Practice weak (${Math.min(weak.length, SESSION_TARGET)})`}
            testID="vocabulary-weak-practice"
            onPress={onPractice}
          />
        ) : null
      }
    >
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Review expressions that were unclear or easy to confuse.
      </Text>

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
          const label = row.term?.trim() || row.itemId;
          return (
            <View
              key={row.itemId}
              accessible
              accessibilityLabel={`${label}, ${row.incorrectCount} incorrect, ${row.correctCount} correct`}
              style={[
                styles.row,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.borderSubtle,
                },
              ]}
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
    fontSize: themeTokens.typography.size.label,
    lineHeight: themeTokens.typography.lineHeight.label,
  },
  list: {
    gap: themeTokens.spacing['12'],
  },
  meta: {
    fontSize: themeTokens.typography.size.label,
    lineHeight: themeTokens.typography.lineHeight.label,
  },
  retry: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 44,
    marginTop: themeTokens.spacing.sm,
    paddingVertical: 12,
  },
  row: {
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    gap: 4,
    minHeight: 44,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing['12'],
  },
  state: {
    gap: themeTokens.spacing.sm,
  },
  term: {
    fontSize: themeTokens.typography.size.label,
    fontWeight: '500',
    lineHeight: themeTokens.typography.lineHeight.label,
  },
});
