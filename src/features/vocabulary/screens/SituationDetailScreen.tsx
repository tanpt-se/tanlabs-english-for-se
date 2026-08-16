import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VocabularyStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen, NumberedLearningRow, ProgressBanner } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { loadKnownItemIds } from '@/features/vocabulary/data/knownItemsStore';
import { vocabularyErrorMessage, useVocabularySituationItems } from '@/features/vocabulary/hooks';
import { CORE_SESSION_MIN, CORE_SESSION_TARGET } from '@/features/vocabulary/utils/composeSession';
import { pickFirstUnlearnedCore } from '@/features/vocabulary/utils/continueCore';
import { countKnownInSituation } from '@/features/vocabulary/utils/progress';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function SituationDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyStackParamList>>();
  const route = useRoute<RouteProp<VocabularyStackParamList, 'VocabularySituation'>>();
  const colors = useAppColors();
  const catalogQuery = useVocabularySituationItems(route.params.situationId);
  const catalog = catalogQuery.data;
  const situation = catalog?.situation;
  const situationId = situation?.slug ?? route.params.situationId;
  const expressions = useMemo(
    () => catalog?.coreItems ?? catalog?.items ?? [],
    [catalog?.coreItems, catalog?.items],
  );
  const title = situation?.title ?? 'Situation';
  const description =
    situation?.description ?? 'Give clear updates, surface blockers, and align next steps.';
  const total = catalog?.coreItems?.length ?? situation?.coreItemIds?.length ?? expressions.length;

  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());

  const refreshKnown = useCallback(async () => {
    setKnownIds(await loadKnownItemIds());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshKnown().catch(() => undefined);
    }, [refreshKnown]),
  );

  const practiceCount = Math.min(
    CORE_SESSION_TARGET,
    Math.max(CORE_SESSION_MIN, expressions.length || CORE_SESSION_TARGET),
  );
  const practiceLabel = `Practice ${practiceCount} question${practiceCount === 1 ? '' : 's'}`;

  const knownCount = countKnownInSituation(
    situationId,
    knownIds,
    situation?.coreItemIds?.length
      ? situation.coreItemIds
      : situation?.itemIds ?? expressions.map((item) => item.id),
  );
  const progressRatio = total === 0 ? 0 : Math.min(1, knownCount / total);
  const continueExpression = pickFirstUnlearnedCore(expressions, knownIds);

  const openPractice = () =>
    navigation.navigate('VocabularyPracticeFlow', {
      screen: 'VocabularyPractice',
      params: {
        situationId,
        mode: 'situation',
      },
    });

  const openTerm = (itemId: string) =>
    navigation.navigate('VocabularyTerm', { situationId, itemId });

  return (
    <LearningScreen
      testID="vocabulary-situation"
      contentGap={16}
      header={<TopAppHeader showBack title={title} onBackPress={() => navigation.goBack()} />}
      footer={
        catalogQuery.isSuccess && catalog ? (
          continueExpression ? (
            <BottomActionBar
              label={`Continue with ${continueExpression.text}`}
              testID="vocabulary-situation-continue"
              onPress={() => openTerm(continueExpression.id)}
            />
          ) : (
            <BottomActionBar label={practiceLabel} testID="practice-cta" onPress={openPractice} />
          )
        ) : null
      }
    >
      {catalogQuery.isLoading ? (
        <BrandLoading fill size="md" testID="vocabulary-situation-loading" />
      ) : null}
      {catalogQuery.isError ? (
        <View style={styles.state}>
          <Text style={[styles.blurb, { color: colors.danger }]}>
            {vocabularyErrorMessage(catalogQuery.error, 'Couldn’t load this situation.')}
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="vocabulary-situation-retry"
            onPress={() => {
              catalogQuery.refetch().catch(() => undefined);
            }}
          >
            <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {catalogQuery.isSuccess && !catalog ? (
        <Text style={[styles.blurb, { color: colors.textMuted }]}>Situation not found.</Text>
      ) : null}
      {catalog ? (
        <>
          <Text style={[styles.blurb, { color: colors.textSecondary }]}>{description}</Text>
          <ProgressBanner
            title={`${Math.round(progressRatio * 100)}% learned`}
            subtitle={`${knownCount} of ${total} core expressions known`}
            progress={progressRatio}
          />
          <Pressable
            accessibilityLabel="Browse all terms"
            accessibilityRole="button"
            testID="vocabulary-browse-all"
            onPress={() => navigation.navigate('VocabularyLibrary', { situationId })}
            style={({ pressed }) => [
              styles.browse,
              { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.browseLabel, { color: colors.primary }]}>Browse all terms</Text>
          </Pressable>
          {continueExpression ? (
            <Pressable
              accessibilityRole="button"
              testID="practice-cta"
              onPress={openPractice}
              style={({ pressed }) => [
                styles.practice,
                { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.practiceLabel, { color: colors.text }]}>{practiceLabel}</Text>
            </Pressable>
          ) : null}
          <View style={styles.list}>
            {expressions.map((expression, index) => {
              const known = knownIds.has(expression.id);
              const active = !known && continueExpression?.id === expression.id;
              const statusLabel = known ? 'Known' : 'Learning';
              return (
                <NumberedLearningRow
                  key={expression.id}
                  accessibilityLabel={`${expression.text}, ${expression.pos}. ${statusLabel}`}
                  index={index + 1}
                  subtitle={`${expression.pos} · ${expression.level}`}
                  testID={`vocabulary-core-${expression.id}`}
                  title={expression.text}
                  tone={known ? 'completed' : active ? 'active' : 'upcoming'}
                  onPress={() => openTerm(expression.id)}
                />
              );
            })}
            {expressions.length === 0 ? (
              <Text style={[styles.blurb, { color: colors.textMuted }]}>
                No core expressions in this situation yet.
              </Text>
            ) : null}
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Core list for this situation. Browse all terms for the full library.
            </Text>
          </View>
        </>
      ) : null}
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  browse: {
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
  },
  browseLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  blurb: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
  practice: {
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
  },
  practiceLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  retry: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 44,
    marginTop: themeTokens.spacing.sm,
    paddingVertical: 12,
  },
  state: {
    gap: themeTokens.spacing.sm,
  },
});
