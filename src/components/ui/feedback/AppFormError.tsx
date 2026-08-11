import { StyleSheet, Text } from 'react-native';

import { useAppColors } from '@/theme';

type AppFormErrorProps = {
  message: string;
  nativeID?: string;
};

export function AppFormError({ message, nativeID }: AppFormErrorProps) {
  const colors = useAppColors();

  return (
    <Text
      nativeID={nativeID}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      style={[styles.error, { color: colors.danger }]}
    >
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 14,
  },
});
