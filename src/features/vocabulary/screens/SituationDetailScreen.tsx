import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VocabularyStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen, ProgressBanner } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { SegmentedControl } from '@/components/ui/selection';
import { LevelSectionHeader, TermRow } from '@/features/vocabulary/components';
import { loadKnownItemIds, toggleItemKnown } from '@/features/vocabulary/data/knownItemsStore';
import { vocabularyErrorMessage, useVocabularySituationItems } from '@/features/vocabulary/hooks';
import { SESSION_TARGET } from '@/features/vocabulary/utils/composeSession';
import { CEFR_LEVELS, groupByCefrLevel, type CefrLevel } from '@/features/vocabulary/utils/levels';
import { countKnownInSituation, formatProgress } from '@/features/vocabulary/utils/progress';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Filter = 'all' | 'learning' | 'known';

export function SituationDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyStackParamList>>();
  const route = useRoute<RouteProp<VocabularyStackParamList, 'VocabularySituation'>>();
  const colors = useAppColors();
  const catalogQuery = useVocabularySituationItems(route.params.situationId);
  const catalog = catalogQuery.data;
  const situation = catalog?.situation;
  const expressions = useMemo(() => catalog?.items ?? [], [catalog?.items]);
  const listMeta = {
    shown: catalog?.shown ?? 0,
    total: catalog?.total ?? 0,
    capped: catalog?.capped ?? false,
  };
  const title = situation?.title ?? 'Situation';
  const description =
    situation?.description ?? 'Give clear updates, surface blockers, and align next steps.';
  const total = situation?.total ?? expressions.length;

  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');
  const [collapsedLevels, setCollapsedLevels] = useState<Set<CefrLevel>>(() => new Set());

  const refreshKnown = useCallback(async () => {
    setKnownIds(await loadKnownItemIds());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshKnown().catch(() => undefined);
    }, [refreshKnown]),
  );

  const visible = useMemo(() => {
    if (filter === 'known') {
      return expressions.filter((item) => knownIds.has(item.id));
    }
    if (filter === 'learning') {
      return expressions.filter((item) => !knownIds.has(item.id));
    }
    return expressions;
  }, [expressions, filter, knownIds]);

  const levelGroups = useMemo(
    () => groupByCefrLevel(visible, catalog?.levelTotals),
    [catalog?.levelTotals, visible],
  );

  const practiceCount: number = SESSION_TARGET;

  const onToggleKnown = useCallback(async (itemId: string) => {
    const nextKnown = await toggleItemKnown(itemId);
    setKnownIds((prev) => {
      const next = new Set(prev);
      if (nextKnown) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  const toggleLevel = useCallback((level: CefrLevel) => {
    setCollapsedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }, []);

  const knownCount = countKnownInSituation(
    situation?.slug ?? route.params.situationId,
    knownIds,
    situation?.itemIds ?? expressions.map((item) => item.id),
  );
  const learningCount = Math.max(0, total - knownCount);
  const progressRatio = total === 0 ? 0 : Math.min(1, knownCount / total);

  const segments = useMemo(
    () =>
      [
        { key: 'all' as const, label: `All (${total})` },
        { key: 'learning' as const, label: `Learning (${learningCount})` },
        { key: 'known' as const, label: `Known (${knownCount})` },
      ] as const,
    [knownCount, learningCount, total],
  );

  return (
    <LearningScreen
      testID="vocabulary-situation"
      contentGap={16}
      header={<TopAppHeader showBack title={title} onBackPress={() => navigation.goBack()} />}
      footer={
        catalogQuery.isSuccess && catalog ? (
          <BottomActionBar
            label={`Practice ${practiceCount} question${practiceCount === 1 ? '' : 's'}`}
            testID="practice-cta"
            onPress={() =>
              navigation.navigate('VocabularyPracticeFlow', {
                screen: 'VocabularyPractice',
                params: {
                  situationId: situation?.slug ?? route.params.situationId,
                  mode: 'situation',
                },
              })
            }
          />
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
            title={`Progress ${formatProgress(knownCount, total)}`}
            subtitle={
              listMeta.capped
                ? `${knownCount} known · list preview ${listMeta.shown}/${listMeta.total}`
                : `${knownCount} known · ${learningCount} still learning`
            }
            progress={progressRatio}
          />
          <SegmentedControl
            options={segments}
            value={filter}
            onChange={setFilter}
            testID="vocabulary-filter"
          />
          <View style={styles.list}>
            {levelGroups.map((group) => {
              const collapsed = collapsedLevels.has(group.level);
              return (
                <View key={group.level} style={styles.levelBlock}>
                  <LevelSectionHeader
                    level={group.level}
                    count={group.total}
                    collapsed={collapsed}
                    onToggle={() => toggleLevel(group.level)}
                  />
                  {collapsed
                    ? null
                    : group.items.map((expression) => (
                        <TermRow
                          key={expression.id}
                          term={expression.text}
                          pos={expression.pos}
                          known={knownIds.has(expression.id)}
                          onPressRow={() =>
                            navigation.navigate('VocabularyTerm', {
                              situationId: situation?.slug ?? route.params.situationId,
                              itemId: expression.id,
                            })
                          }
                          onToggleKnown={() => {
                            onToggleKnown(expression.id).catch(() => undefined);
                          }}
                        />
                      ))}
                </View>
              );
            })}
            {visible.length === 0 ? (
              <Text style={[styles.blurb, { color: colors.textMuted }]}>
                {filter === 'known'
                  ? 'No known terms yet — mark some with Known.'
                  : 'No terms in this filter.'}
              </Text>
            ) : null}
            {levelGroups.length > 0 ? (
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Grouped by Cambridge CEFR ({CEFR_LEVELS.join(' · ')}). Tap a term for the dictionary
                entry.
              </Text>
            ) : null}
          </View>
        </>
      ) : null}
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  blurb: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  levelBlock: {
    gap: 12,
  },
  list: {
    gap: 12,
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
