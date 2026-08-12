import { StyleSheet, Text, View } from 'react-native';

import { LearningScreen } from '@/components/ui/learning';
import { TopAppHeader } from '@/components/ui/navigation';
import { themeTokens, useAppColors } from '@/theme';

export function InterviewHomeScreen() {
  const colors = useAppColors();

  return (
    <LearningScreen testID="interview-home" header={<TopAppHeader title="Interview" />}>
      <View style={styles.block}>
        <Text style={[styles.title, { color: colors.text }]}>Coming soon</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Structured interview practice will open here when the feature is available.
        </Text>
      </View>
    </LearningScreen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: themeTokens.spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
});
