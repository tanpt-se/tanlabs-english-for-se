import { Box, Heading, Text } from '@gluestack-ui/themed';

type AuthHeaderProps = {
  subtitle?: string;
  title: string;
};

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <Box mb="$6" gap="$2">
      <Heading size="2xl" color="$textLight900">
        {title}
      </Heading>
      {subtitle ? (
        <Text color="$textLight600" fontSize="$md" lineHeight="$lg">
          {subtitle}
        </Text>
      ) : null}
    </Box>
  );
}
