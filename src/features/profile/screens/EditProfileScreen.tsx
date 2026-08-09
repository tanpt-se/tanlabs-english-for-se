import {
  Box,
  Button,
  ButtonText,
  FormControl,
  FormControlError,
  FormControlErrorText,
  Input,
  InputField,
  Pressable,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { AppStackParamList } from '@/app/navigation/types';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useAuth } from '@/core/auth/AuthProvider';
import { upsertProfile } from '@/core/profile/service';
import { ENGLISH_LEVELS } from '@/core/profile/validation';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { accessibleButtonProps } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const { data: queriedProfile, fetchStatus, refetch } = useProfile();
  const queryClient = useQueryClient();
  const profile = queriedProfile ?? authProfile;

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [englishLevel, setEnglishLevel] = useState<(typeof ENGLISH_LEVELS)[number]>(
    (profile?.english_level as (typeof ENGLISH_LEVELS)[number]) ?? 'B1',
  );
  const [profileHydrated, setProfileHydrated] = useState(Boolean(profile));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileHydrated && profile) {
      setDisplayName(profile.display_name);
      setEnglishLevel(profile.english_level as (typeof ENGLISH_LEVELS)[number]);
      setProfileHydrated(true);
    }
  }, [profile, profileHydrated]);

  if (!profileHydrated) {
    const isFetchingProfile = fetchStatus === 'fetching';
    return (
      <ScreenScroll>
        <AuthHeader title="Edit profile" subtitle="Update how we greet you." />
        <VStack space="md">
          <Text color="$textLight900">
            {isFetchingProfile
              ? 'Loading profile…'
              : 'Profile is unavailable. Reconnect to the internet and try again.'}
          </Text>
          {!isFetchingProfile ? (
            <Button
              accessibilityLabel="Retry loading profile"
              accessibilityRole="button"
              {...accessibleButtonProps}
              onPress={() => {
                refetch().catch(() => undefined);
              }}
            >
              <ButtonText>Retry</ButtonText>
            </Button>
          ) : null}
        </VStack>
      </ScreenScroll>
    );
  }

  const onSubmit = async () => {
    if (!user?.id) {
      setError('Missing session.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsertProfile({
        userId: user.id,
        displayName,
        englishLevel,
      });
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      await refreshProfile();
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll>
      <AuthHeader title="Edit profile" subtitle="Update how we greet you." />
      <VStack space="md">
        <FormControl isInvalid={Boolean(error)}>
          <Input>
            <InputField
              accessibilityLabel="Display name"
              placeholder="Display name"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </Input>
        </FormControl>
        <Text accessibilityRole="header" color="$textLight900">
          English level
        </Text>
        <Box flexDirection="row" flexWrap="wrap" gap="$2">
          {ENGLISH_LEVELS.map((level) => (
            <Pressable
              key={level}
              accessibilityLabel={`English level ${level}`}
              accessibilityRole="button"
              accessibilityState={{ selected: englishLevel === level }}
              onPress={() => setEnglishLevel(level)}
            >
              <Box
                px="$3"
                minHeight={44}
                minWidth={44}
                justifyContent="center"
                alignItems="center"
                borderRadius="$md"
                bg={englishLevel === level ? '$primary500' : '$white'}
                borderWidth={1}
                borderColor="$borderLight200"
              >
                <Text color={englishLevel === level ? '$white' : '$textLight900'}>{level}</Text>
              </Box>
            </Pressable>
          ))}
        </Box>
        {error ? (
          <FormControl isInvalid>
            <FormControlError>
              <FormControlErrorText>{error}</FormControlErrorText>
            </FormControlError>
          </FormControl>
        ) : null}
        <Button
          accessibilityLabel="Save profile"
          accessibilityRole="button"
          {...accessibleButtonProps}
          onPress={onSubmit}
          isDisabled={loading}
        >
          <ButtonText>{loading ? 'Saving…' : 'Save'}</ButtonText>
        </Button>
      </VStack>
    </ScreenScroll>
  );
}
