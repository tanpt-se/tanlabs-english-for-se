import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/theme';

type SettingRowProps = {
  label: string;
  onPress?: () => void;
  value?: string;
};

export function SettingRow({ label, value, onPress }: SettingRowProps) {
  const colors = useAppColors();

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View
        style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {value ? <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    flexShrink: 1,
    marginRight: 8,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
