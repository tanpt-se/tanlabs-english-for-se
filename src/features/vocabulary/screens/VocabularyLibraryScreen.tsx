import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VocabularyStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { AppTextInput } from '@/components/ui/input';
import { LearningScreen } from '@/components/ui/learning';
import { TopAppHeader } from '@/components/ui/navigation';
import { SegmentedControl } from '@/components/ui/selection';
import { TermRow } from '@/features/vocabulary/components';
import { VOCABULARY_LIBRARY_PAGE_SIZE } from '@/features/vocabulary/data/catalogConstants';
import { loadKnownItemIds, toggleItemKnown } from '@/features/vocabulary/data/knownItemsStore';
import {
  vocabularyErrorMessage,
  useVocabularyLibrary,
  useVocabularySituations,
} from '@/features/vocabulary/hooks';
import { CEFR_LEVELS } from '@/features/vocabulary/utils/levels';
import { themeTokens, useAppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function VocabularyLibraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyStackParamList>>();
  const route = useRoute<RouteProp<VocabularyStackParamList, 'VocabularyLibrary'>>();
  const colors = useAppColors();
  const situationsQuery = useVocabularySituations();
  const initialSituation = route.params?.situationId ?? 'all';
  const [query, setQuery] = useState('');
  const [situationSlug, setSituationSlug] = useState(initialSituation);
  const [level, setLevel] = useState('all');
  const [offset, setOffset] = useState(0);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());

  const libraryQuery = useVocabularyLibrary({ query, situationSlug, level, offset });
  const page = libraryQuery.data;

  useFocusEffect(
    useCallback(() => {
      loadKnownItemIds()
        .then(setKnownIds)
        .catch(() => undefined);
    }, []),
  );

  const situationOptions = useMemo(
    () => [
      { key: 'all', label: 'All' },
      ...(situationsQuery.data ?? []).map((situation) => ({
        key: situation.slug,
        label: situation.title,
      })),
    ],
    [situationsQuery.data],
  );

  const levelOptions = useMemo(
    () => [
      { key: 'all', label: 'All' },
      ...CEFR_LEVELS.map((item) => ({ key: item, label: item })),
    ],
    [],
  );

  const onFilterChange = (nextSituation: string, nextLevel: string) => {
    setSituationSlug(nextSituation);
    setLevel(nextLevel);
    setOffset(0);
  };

  return (
    <LearningScreen
      testID="vocabulary-library"
      contentGap={16}
      header={<TopAppHeader showBack title="Library" onBackPress={() => navigation.goBack()} />}
    >
      <Text style={[styles.blurb, { color: colors.textSecondary }]}>
        Search the reference library. Core expressions stay at the top.
      </Text>
      <AppTextInput
        accessibilityLabel="Search terms"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(value) => {
          setQuery(value);
          setOffset(0);
        }}
        placeholder="Search term or meaning"
        testID="vocabulary-library-search"
        value={query}
      />
      <Text style={[styles.filterLabel, { color: colors.textMuted }]}>Situation</Text>
      <View style={styles.chipRow} testID="vocabulary-library-situation">
        {situationOptions.map((option) => {
          const active =
            (situationOptions.some((entry) => entry.key === situationSlug)
              ? situationSlug
              : 'all') === option.key;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onFilterChange(option.key, level)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primarySoft : colors.surfaceSecondary,
                  borderColor: active ? colors.primary : colors.borderSubtle,
                },
              ]}
              testID={`vocabulary-library-situation-${option.key}`}
            >
              <Text style={[styles.chipLabel, { color: active ? colors.primary : colors.text }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.filterLabel, { color: colors.textMuted }]}>CEFR</Text>
      <SegmentedControl
        options={levelOptions}
        value={level}
        onChange={(key) => onFilterChange(situationSlug, key)}
        testID="vocabulary-library-level"
      />
      {libraryQuery.isLoading ? (
        <BrandLoading fill size="md" testID="vocabulary-library-loading" />
      ) : null}
      {libraryQuery.isError ? (
        <Text style={[styles.blurb, { color: colors.danger }]}>
          {vocabularyErrorMessage(libraryQuery.error, 'Couldn’t load the library.')}
        </Text>
      ) : null}
      {page ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {page.total} term{page.total === 1 ? '' : 's'}
        </Text>
      ) : null}
      <View style={styles.list}>
        {(page?.items ?? []).map((item) => (
          <TermRow
            key={item.id}
            term={item.text}
            pos={item.pos}
            known={knownIds.has(item.id)}
            onPressRow={() =>
              navigation.navigate('VocabularyTerm', {
                situationId: item.situationSlug ?? situationSlug,
                itemId: item.id,
              })
            }
            onToggleKnown={() => {
              toggleItemKnown(item.id)
                .then((next) => {
                  setKnownIds((prev) => {
                    const copy = new Set(prev);
                    if (next) copy.add(item.id);
                    else copy.delete(item.id);
                    return copy;
                  });
                })
                .catch(() => undefined);
            }}
          />
        ))}
      </View>
      {page && page.offset + page.items.length < page.total ? (
        <Pressable
          accessibilityRole="button"
          testID="vocabulary-library-more"
          onPress={() => setOffset(page.offset + VOCABULARY_LIBRARY_PAGE_SIZE)}
        >
          <Text style={[styles.more, { color: colors.primary }]}>Load more</Text>
        </Pressable>
      ) : null}
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  blurb: {
    fontSize: 14,
    lineHeight: 20,
  },
  chip: {
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeTokens.spacing.sm,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  list: {
    gap: 12,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  more: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 44,
    paddingVertical: 12,
  },
});
