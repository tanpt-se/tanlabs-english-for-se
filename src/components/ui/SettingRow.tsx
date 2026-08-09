import { HStack, Pressable, Text } from '@gluestack-ui/themed';

type SettingRowProps = {
  label: string;
  onPress?: () => void;
  value?: string;
};

export function SettingRow({ label, value, onPress }: SettingRowProps) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <HStack
        px="$4"
        py="$3"
        bg="$white"
        borderBottomWidth={1}
        borderColor="$borderLight200"
        justifyContent="space-between"
        alignItems="center"
      >
        <Text>{label}</Text>
        {value ? <Text color="$textLight500">{value}</Text> : null}
      </HStack>
    </Pressable>
  );
}
