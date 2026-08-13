import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AuthStackParamList } from '@/app/navigation/types';
import { AppText } from '@/components/ui/typography';
import { useAuth } from '@/core/auth/AuthProvider';
import { brand, themeTokens } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const heroSource = require('../../../assets/brand/welcome-hero.png');

/** Brand cover (Figma 01 · Welcome): navy field, chalk H1, coral CTA + ghost. */
export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { recoveryLinkError } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (recoveryLinkError) {
      navigation.replace('Login');
    }
  }, [navigation, recoveryLinkError]);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: brand.navy900,
          paddingBottom: Math.max(insets.bottom, themeTokens.spacing.lg),
          paddingTop: Math.max(insets.top, themeTokens.spacing.lg),
        },
      ]}
    >
      <View style={styles.stack}>
        <View style={styles.hero}>
          <View style={styles.heroBox}>
            <Image
              accessibilityLabel="TanLabs logo"
              accessibilityRole="image"
              resizeMode="contain"
              source={heroSource}
              style={styles.heroImage}
            />
          </View>
          <View style={styles.copy}>
            <AppText
              accessibilityRole="header"
              align="center"
              color={brand.chalk}
              style={styles.headline}
              variant="h1"
            >
              {'English that moves\nyour career forward.'}
            </AppText>
            <AppText align="center" color={brand.fog} variant="label">
              Practice the grammar, vocabulary, and interview language software engineers use every
              day.
            </AppText>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Get started"
            accessibilityRole="button"
            testID="welcome-get-started"
            onPress={() => navigation.navigate('Register')}
            style={({ pressed }) => [styles.ctaPrimary, { opacity: pressed ? 0.88 : 1 }]}
          >
            <AppText color={brand.navy900} variant="body" weight="500">
              Get started
            </AppText>
          </Pressable>
          <Pressable
            accessibilityLabel="Already learning? Sign in"
            accessibilityRole="button"
            testID="welcome-sign-in"
            onPress={() => navigation.navigate('Login')}
            style={({ pressed }) => [styles.ctaGhost, { opacity: pressed ? 0.75 : 1 }]}
          >
            <AppText color={brand.coral400} variant="body" weight="500">
              Already learning? Sign in
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: themeTokens.spacing['12'],
    width: '100%',
  },
  copy: {
    gap: themeTokens.spacing['12'],
    width: '100%',
  },
  ctaGhost: {
    alignItems: 'center',
    borderRadius: themeTokens.radius.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing['12'],
    width: '100%',
  },
  ctaPrimary: {
    alignItems: 'center',
    backgroundColor: brand.coral400,
    borderColor: brand.coral400,
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing['12'],
    width: '100%',
  },
  headline: {
    letterSpacing: -0.3,
  },
  hero: {
    alignItems: 'center',
    gap: themeTokens.spacing['12'],
    width: '100%',
  },
  heroBox: {
    alignItems: 'center',
    height: 238,
    justifyContent: 'center',
    width: '100%',
  },
  heroImage: {
    borderRadius: themeTokens.radius['2xl'],
    height: 238,
    width: 342,
  },
  root: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: themeTokens.spacing.lg,
  },
  stack: {
    alignItems: 'center',
    gap: themeTokens.spacing['40'],
    maxWidth: 342,
    width: '100%',
  },
});
