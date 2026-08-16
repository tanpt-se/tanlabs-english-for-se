import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VocabularyStackParamList } from '@/app/navigation/types';
import { BrandLoading } from '@/components/ui/feedback';
import { LearningScreen } from '@/components/ui/learning';
import { BottomActionBar, TopAppHeader } from '@/components/ui/navigation';
import { PosBadge } from '@/features/vocabulary/components';
import { loadKnownItemIds, toggleItemKnown } from '@/features/vocabulary/data/knownItemsStore';
import { vocabularyErrorMessage, useVocabularyTerm } from '@/features/vocabulary/hooks';
import type { VocabularyCountability } from '@/features/vocabulary/types/catalog';
import { getPosMeta } from '@/features/vocabulary/utils/pos';
import { displayPronunciation } from '@/features/vocabulary/utils/pronunciation';
import { themeTokens, useAppColors } from '@/theme';
import type { AppColors } from '@/theme';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

function countabilityChip(value: VocabularyCountability | null | undefined): string | null {
  if (value === 'countable') {
    return '[ C ]';
  }
  if (value === 'uncountable') {
    return '[ U ]';
  }
  if (value === 'both') {
    return '[ C/U ]';
  }
  return null;
}

/**
 * Dictionary-style term detail (Figma Vocabulary 03):
 * POS, countability, pronunciation, examples, Mark as known.
 */
export function TermDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VocabularyStackParamList>>();
  const route = useRoute<RouteProp<VocabularyStackParamList, 'VocabularyTerm'>>();
  const colors = useAppColors();
  const termQuery = useVocabularyTerm(route.params.situationId, route.params.itemId);
  const term = termQuery.data ?? null;
  const [known, setKnown] = useState(false);

  const refreshKnown = useCallback(async () => {
    if (!term) {
      return;
    }
    const ids = await loadKnownItemIds();
    setKnown(ids.has(term.id));
  }, [term]);

  useFocusEffect(
    useCallback(() => {
      refreshKnown().catch(() => undefined);
    }, [refreshKnown]),
  );

  const onToggleKnown = useCallback(async () => {
    if (!term) {
      return;
    }
    const next = await toggleItemKnown(term.id);
    setKnown(next);
  }, [term]);

  const posMeta = useMemo(() => (term ? getPosMeta(term.pos) : null), [term]);
  const countability = term ? countabilityChip(term.countability) : null;
  const pronunciation = term ? displayPronunciation(term.pronunciation) : null;

  if (termQuery.isLoading) {
    return (
      <LearningScreen
        testID="vocabulary-term-loading"
        contentGap={16}
        header={<TopAppHeader showBack title="Term" onBackPress={() => navigation.goBack()} />}
      >
        <BrandLoading fill size="md" testID="vocabulary-term-loading-indicator" />
      </LearningScreen>
    );
  }

  if (termQuery.isError) {
    return (
      <LearningScreen
        testID="vocabulary-term-error"
        contentGap={16}
        header={<TopAppHeader showBack title="Term" onBackPress={() => navigation.goBack()} />}
      >
        <Text style={[styles.body, { color: colors.danger }]}>
          {vocabularyErrorMessage(termQuery.error, 'Couldn’t load this term.')}
        </Text>
        <Pressable
          accessibilityRole="button"
          testID="vocabulary-term-retry"
          onPress={() => {
            termQuery.refetch().catch(() => undefined);
          }}
        >
          <Text style={[styles.retry, { color: colors.primary }]}>Retry</Text>
        </Pressable>
      </LearningScreen>
    );
  }

  if (!term) {
    return (
      <LearningScreen
        testID="vocabulary-term-missing"
        contentGap={16}
        header={<TopAppHeader showBack title="Term" onBackPress={() => navigation.goBack()} />}
      >
        <Text style={[styles.body, { color: colors.textMuted }]}>
          This term is not available in the current pack.
        </Text>
      </LearningScreen>
    );
  }

  return (
    <LearningScreen
      testID="vocabulary-term"
      contentGap={16}
      header={<TopAppHeader showBack title={term.term} onBackPress={() => navigation.goBack()} />}
      footer={
        <BottomActionBar
          label={known ? 'Marked known' : 'Mark as known'}
          testID="term-known-cta"
          onPress={() => onToggleKnown().catch(() => undefined)}
        />
      }
    >
      <Text style={[styles.eyebrow, { color: colors.primary }]}>WORKPLACE ENGLISH</Text>
      <View style={styles.hero}>
        <Text style={[styles.headword, { color: colors.text }]}>{term.term}</Text>
        <View style={styles.metaRow}>
          <PosBadge pos={term.pos} size="md" />
          {countability ? (
            <View style={[styles.levelChip, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={[styles.levelChipText, { color: colors.text }]}>{countability}</Text>
            </View>
          ) : null}
          <View style={[styles.levelChip, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.levelChipText, { color: colors.text }]}>{term.level}</Text>
          </View>
          <Text style={[styles.metaMuted, { color: colors.textMuted }]}>
            {posMeta?.name}
            {term.situationId ? ` · ${term.situationId}` : ''}
          </Text>
        </View>
        {pronunciation ? (
          <Text style={[styles.pronunciation, { color: colors.textSecondary }]}>
            {pronunciation}
          </Text>
        ) : null}
        <Text style={[styles.context, { color: colors.textSecondary }]}>
          {term.type} · {term.context}
        </Text>
      </View>

      <Section title="Definition" colors={colors}>
        <Text style={[styles.body, { color: colors.text }]}>{term.meaning}</Text>
      </Section>

      {term.examples.length > 0 ? (
        <Section title="Examples" colors={colors}>
          {term.examples.map((example, index) => (
            <View key={`${example.sentence}-${index}`} style={styles.exampleBlock}>
              {example.label ? (
                <Text style={[styles.exampleLabel, { color: colors.textMuted }]}>
                  {example.label}
                </Text>
              ) : null}
              <Text style={[styles.exampleSentence, { color: colors.text }]}>
                {example.sentence}
              </Text>
            </View>
          ))}
        </Section>
      ) : null}

      {term.patterns.length > 0 ? (
        <Section title="Patterns" colors={colors}>
          {term.patterns.map((pattern) => (
            <Text key={pattern} style={[styles.bullet, { color: colors.text }]}>
              · {pattern}
            </Text>
          ))}
        </Section>
      ) : null}

      {term.alternatives.length > 0 ? (
        <Section title="Alternatives" colors={colors}>
          <Text style={[styles.body, { color: colors.text }]}>{term.alternatives.join(' · ')}</Text>
        </Section>
      ) : null}

      {term.notes.length > 0 ? (
        <Section title="Notes" colors={colors}>
          {term.notes.map((note) => (
            <Text key={note} style={[styles.bullet, { color: colors.textSecondary }]}>
              · {note}
            </Text>
          ))}
        </Section>
      ) : null}

      <Text style={[styles.attribution, { color: colors.textMuted }]}>
        Layout inspired by Cambridge Essential American Dictionary entries. Content is TanLabs
        workplace English, not Cambridge text.
      </Text>
    </LearningScreen>
  );
}

function Section({
  children,
  colors,
  title,
}: {
  children: ReactNode;
  colors: AppColors;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  attribution: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: themeTokens.spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
  },
  context: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textTransform: 'capitalize',
  },
  exampleBlock: {
    gap: 2,
    marginBottom: 8,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  exampleSentence: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.66,
    lineHeight: 15,
  },
  headword: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  hero: {
    gap: 4,
    marginBottom: 4,
  },
  levelChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  metaMuted: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pronunciation: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 21,
    marginTop: 4,
  },
  retry: {
    fontSize: 15,
    fontWeight: '600',
    minHeight: 44,
    marginTop: themeTokens.spacing.sm,
    paddingVertical: 12,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
});
