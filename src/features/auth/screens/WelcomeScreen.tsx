import { useNavigation } from '@react-navigation/native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AuthStackParamList } from '@/app/navigation/types';
import { brand, themeTokens } from '@/theme';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const heroSource = require('../../../assets/brand/welcome-hero.png');

/** Brand cover (Figma 01 · Welcome): always navy field, chalk type, coral CTA. */
export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();

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
        <View style={styles.heroBox}>
          <Image
            accessibilityLabel="TanLabs logo"
            accessibilityRole="image"
            resizeMode="contain"
            source={heroSource}
            style={styles.heroImage}
          />
        </View>
        <Text accessibilityRole="header" style={styles.headline}>
          {'English that moves\nyour career forward.'}
        </Text>
        <Text style={styles.body}>
          Practice the grammar, vocabulary, and interview language software engineers use every day.
        </Text>
        <Pressable
          accessibilityLabel="Get started"
          accessibilityRole="button"
          testID="welcome-get-started"
          onPress={() => navigation.navigate('Register')}
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.88 : 1 }]}
        >
          <Text style={styles.ctaLabel}>Get started</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Already learning? Sign in"
          accessibilityRole="link"
          style={styles.link}
          testID="welcome-sign-in"
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>Already learning? Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: brand.fog,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    width: '100%',
  },
  cta: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: brand.coral400,
    borderColor: brand.coral400,
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    minWidth: 160,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing.md,
    width: '100%',
  },
  ctaLabel: {
    color: brand.navy900,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  headline: {
    color: brand.chalk,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 44,
    textAlign: 'center',
  },
  heroBox: {
    alignItems: 'center',
    height: 238,
    justifyContent: 'center',
    width: '100%',
  },
  heroImage: {
    height: 238,
    width: 342,
  },
  link: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    minHeight: 44,
    width: '100%',
  },
  linkText: {
    color: brand.coral400,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
  },
  root: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: themeTokens.spacing.lg,
  },
  stack: {
    alignItems: 'center',
    gap: themeTokens.spacing['14'],
    maxWidth: 342,
    width: '100%',
  },
});
