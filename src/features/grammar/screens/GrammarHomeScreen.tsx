import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { learningDisabledDestinations } from '@/app/navigation/learningDisabledDestinations';
import type { AppStackParamList } from '@/app/navigation/types';
import { useMainTabSelect } from '@/app/navigation/useMainTabSelect';
import { ScreenScroll } from '@/components/ui/layout';
import { BottomNavigation } from '@/components/ui/navigation';
import { TopAppHeader } from '@/components/ui/navigation';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { themeTokens, useAppColors } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * Grammar entry. Fail-closed when `feature_grammar` is not strictly true.
 * Nested routes stay mounted; only this screen redirects.
 */
export function GrammarHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const onSelectTab = useMainTabSelect();
  const flags = useFeatureFlags();
  const colors = useAppColors();
  const grammarEnabled = flags.data?.grammar === true;

  useEffect(() => {
    if (!grammarEnabled) {
      navigation.navigate('Home');
    }
  }, [grammarEnabled, navigation]);

  if (!grammarEnabled) {
    return null;
  }

  return (
    <ScreenScroll
      footer={
        <BottomNavigation
          active="grammar"
          disabledDestinations={learningDisabledDestinations(flags.data)}
          onSelect={onSelectTab}
        />
      }
    >
      <View style={styles.stack} testID="grammar-home">
        <TopAppHeader title="Grammar" />
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Five workplace tenses. Content loads from published lessons — practice UI lands in PH2
          Sprint 2+.
        </Text>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          Topics and lessons will appear here once the Grammar content service is connected.
        </Text>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    fontSize: 14,
    lineHeight: 20,
  },
  stack: {
    gap: themeTokens.spacing['14'],
    width: '100%',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 19,
  },
});
