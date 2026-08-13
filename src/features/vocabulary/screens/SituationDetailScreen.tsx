import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { VocabularyStackParamList } from '@/app/navigation/types';
import { LearningScreen, ProgressBanner } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { SegmentedControl } from '@/components/ui/selection';
import { LevelSectionHeader, TermRow } from '@/features/vocabulary/components';
import { loadKnownItemIds, toggleItemKnown } from '@/features/vocabulary/data/knownItemsStore';
import {
  formatProgress,
  getExpressionListMeta,
  getExpressions,
  getLevelTotals,
  getSituation,
} from '@/features/vocabulary/data/mockCatalog';
import { SESSION_TARGET } from '@/features/vocabulary/utils/composeSession';
import { CEFR_LEVELS, groupByCefrLevel, type CefrLevel } from '@/features/vocabulary/utils/levels';
import { countKnownInSituation } from '@/features/vocabulary/utils/progress';
import { useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Filter = 'all' | 'learning' | 'known';

export function SituationDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyStackParamList>>();
  const route = useRoute<RouteProp<VocabularyStackParamList, 'VocabularySituation'>>();
  const colors = useAppColors();
  const situation = getSituation(route.params.situationId);
  const expressions = getExpressions(route.params.situationId);
  const levelTotals = getLevelTotals(route.params.situationId);
  const listMeta = getExpressionListMeta(route.params.situationId);
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

  const levelGroups = useMemo(() => groupByCefrLevel(visible, levelTotals), [levelTotals, visible]);

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

  const knownCount = countKnownInSituation(route.params.situationId, knownIds);
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
      header={<TopAppHeader showBack title={title} onBackPress={() => navigation.goBack()} />}
      footer={
        <BottomActionBar
          label={`Practice ${practiceCount} question${practiceCount === 1 ? '' : 's'}`}
          testID="practice-cta"
          onPress={() =>
            navigation.navigate('VocabularyPracticeFlow', {
              screen: 'VocabularyPractice',
              params: { situationId: route.params.situationId, mode: 'situation' },
            })
          }
        />
      }
    >
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
                          situationId: route.params.situationId,
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
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  blurb: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  levelBlock: {
    gap: 8,
  },
  list: {
    gap: 10,
  },
});
