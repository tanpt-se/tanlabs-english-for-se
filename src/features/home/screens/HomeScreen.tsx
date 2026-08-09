import { Box, Button, ButtonText, Heading, Text, VStack } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';

import { APP_ENV, isDevelopment } from '@/app/config/env';
import type { AppStackParamList } from '@/app/navigation/types';
import { useAuth } from '@/core/auth/AuthProvider';
import { useFeatureFlags } from '@/core/remote-config/useFeatureFlags';
import { useProfile } from '@/features/profile/hooks/useProfile';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { profile: authProfile } = useAuth();
  const { data: profile } = useProfile();
  const flags = useFeatureFlags();
  const current = profile ?? authProfile;

  return (
    <Box flex={1} bg="$backgroundLight100" px="$4" py="$8">
      <VStack space="md">
        <Heading size="xl">Hi {current?.display_name ?? 'there'}</Heading>
        <Text>English level: {current?.english_level ?? '—'}</Text>
        <Box bg="$white" p="$4" borderRadius="$xl" borderWidth={1} borderColor="$borderLight200">
          <Heading size="sm" mb="$2">
            Grammar
          </Heading>
          <Text color="$textLight500">
            {flags.data?.grammar
              ? 'Grammar is enabled.'
              : 'Coming soon — Grammar unlocks in a later phase.'}
          </Text>
        </Box>
        <Button
          testID="home-settings"
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          variant="outline"
          onPress={() => navigation.navigate('Settings')}
        >
          <ButtonText>Settings</ButtonText>
        </Button>
        {isDevelopment ? (
          <Text color="$textLight500">
            env={APP_ENV} · flags loaded={String(Boolean(flags.data))}
          </Text>
        ) : null}
      </VStack>
    </Box>
  );
}
