import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { MainTabParamList, VocabularyStackParamList } from '@/app/navigation/types';
import { LearningScreen, ProgressBanner } from '@/components/ui/learning';
import { TopAppHeader } from '@/components/ui/navigation';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { SituationCard } from '@/features/vocabulary/components';
import { formatProgress, VOCABULARY_SITUATIONS } from '@/features/vocabulary/data/mockCatalog';
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

  useEffect(() => {
    if (!vocabularyEnabled) {
      navigation.navigate('Home');
    }
  }, [navigation, vocabularyEnabled]);

  if (!vocabularyEnabled) {
    return null;
  }

  return (
    <LearningScreen testID="vocabulary-home" header={<TopAppHeader title="Vocabulary" />}>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Useful expressions for real engineering work.
      </Text>
      <ProgressBanner
        title="Progress across 5 workplace situations"
        subtitle="Mock catalog for PH3 preview"
      />
      <Text style={[styles.section, { color: colors.text }]}>Situations</Text>
      <View style={styles.list}>
        {VOCABULARY_SITUATIONS.map((situation) => (
          <SituationCard
            key={situation.id}
            title={situation.title}
            description={situation.description}
            progress={formatProgress(situation.learned, situation.total)}
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
  list: {
    gap: themeTokens.spacing['14'],
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
});
