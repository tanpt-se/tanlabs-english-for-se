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
import { useState } from 'react';

import { AuthHeader } from '@/components/ui/AuthHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { trackEvent } from '@/core/analytics/events';
import { useAuth } from '@/core/auth/AuthProvider';
import { upsertProfile } from '@/core/profile/service';
import { ENGLISH_LEVELS } from '@/core/profile/validation';
import { accessibleButtonProps } from '@/theme';

export function CompleteProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [englishLevel, setEnglishLevel] = useState<(typeof ENGLISH_LEVELS)[number]>('B1');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      await trackEvent('profile_completed');
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll centered>
      <AuthHeader title="Complete profile" subtitle="Tell us how to greet you." />
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
          accessibilityLabel="Continue"
          accessibilityRole="button"
          {...accessibleButtonProps}
          onPress={onSubmit}
          isDisabled={loading}
        >
          <ButtonText>{loading ? 'Saving…' : 'Continue'}</ButtonText>
        </Button>
      </VStack>
    </ScreenScroll>
  );
}
