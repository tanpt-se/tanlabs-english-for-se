import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';

import type { PropsWithChildren } from 'react';

type ProfileSectionProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function ProfileSection({ title, description, children }: ProfileSectionProps) {
  return (
    <Box mb="$4">
      <Heading size="sm" mb="$2" px="$1">
        {title}
      </Heading>
      {description ? (
        <Text color="$textLight500" mb="$2" px="$1">
          {description}
        </Text>
      ) : null}
      <VStack
        bg="$white"
        borderRadius="$xl"
        overflow="hidden"
        borderWidth={1}
        borderColor="$borderLight200"
      >
        {children}
      </VStack>
    </Box>
  );
}
