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
import { signIn } from '@/core/auth/service';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      await trackEvent('login_success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$backgroundLight100" px="$4" justifyContent="center">
      <AuthHeader title="Sign in" subtitle="Continue your SE English practice." />
      <VStack space="md">
        <FormControl isInvalid={Boolean(error)}>
          <Input>
            <InputField
              testID="login-email"
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
              testID="login-password"
              accessibilityLabel="Password"
              placeholder="Password"
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
          testID="login-submit"
          accessibilityLabel="Sign in"
          accessibilityRole="button"
          minHeight={44}
          onPress={onSubmit}
          isDisabled={loading}
        >
          <ButtonText>{loading ? 'Signing in…' : 'Sign in'}</ButtonText>
        </Button>
        <Pressable
          accessibilityLabel="Create an account"
          accessibilityRole="link"
          minHeight={44}
          justifyContent="center"
          onPress={() => navigation.navigate('Register')}
        >
          <Text textAlign="center" color="$primary500">
            Create an account
          </Text>
        </Pressable>
      </VStack>
    </Box>
  );
}
