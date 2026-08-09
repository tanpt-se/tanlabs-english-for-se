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
import { useState } from 'react';

import type { AuthStackParamList } from '@/app/navigation/types';
import { AuthHeader } from '@/components/ui/AuthHeader';
import { trackEvent } from '@/core/analytics/events';
import { signUp } from '@/core/auth/service';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await signUp(email, password);
      await trackEvent('register_success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight100" px="$4" justifyContent="center">
      <AuthHeader title="Create account" subtitle="Email confirmation is off for PH1." />
      <VStack space="md">
        <FormControl isInvalid={Boolean(error)}>
          <Input>
            <InputField
              accessibilityLabel="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
            />
          </Input>
        </FormControl>
        <FormControl isInvalid={Boolean(error)}>
          <Input>
            <InputField
              accessibilityLabel="Password"
              placeholder="Password (min 6)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </Input>
          {error ? (
            <FormControlError>
              <FormControlErrorText>{error}</FormControlErrorText>
            </FormControlError>
          ) : null}
        </FormControl>
        <Button
          accessibilityLabel="Register"
          accessibilityRole="button"
          onPress={onSubmit}
          isDisabled={loading}
        >
          <ButtonText>{loading ? 'Creating…' : 'Register'}</ButtonText>
        </Button>
        <Pressable
          accessibilityLabel="Already have an account? Sign in"
          accessibilityRole="link"
          onPress={() => navigation.navigate('Login')}
        >
          {' '}
          <Text textAlign="center" color="$primary500">
            Already have an account?
          </Text>
        </Pressable>
      </VStack>
    </Box>
  );
}
