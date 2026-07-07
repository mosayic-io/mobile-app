import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg'

import { ScreenErrorBoundary } from '@/src/components/error'
import { Button, Text } from '@/src/components/ui'
import { useColors } from '@/src/hooks/useColors'
import { borderRadius, spacing, type Colors } from '@/src/lib/theme'

const features = ['Supabase auth', 'Push notifications', 'Light & dark theme']

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    glow: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: borderRadius.full,
      backgroundColor: colors.accent,
      opacity: 0.14,
    },
    logo: {
      width: 96,
      height: 96,
    },
    title: {
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      textAlign: 'center',
      paddingHorizontal: spacing.md,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    chip: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    footer: {
      paddingHorizontal: spacing.lg,
    },
  })

function OnboardingScreen() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const float = useSharedValue(0)

  // Gentle vertical drift on the logo, mirrored by withRepeat's reverse pass
  useEffect(() => {
    float.set(
      withRepeat(
        withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    )
  }, [float])

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.get() }],
  }))

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="softGlow" cx="80%" cy="20%" rx="65%" ry="65%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.16" />
            <Stop offset="55%" stopColor={colors.accent} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={colors.background} />
        <Rect width="100%" height="100%" fill="url(#softGlow)" />
      </Svg>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.glow} />
          <Animated.View entering={ZoomIn.springify().damping(12)}>
            <Animated.View style={floatStyle}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(150).duration(600)}>
          <Text variant="h1" style={styles.title}>
            Welcome to Your App
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            This is placeholder copy for your onboarding experience. Customize
            it to match your app&apos;s value proposition.
          </Text>
        </Animated.View>

        <View style={styles.chipRow}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature}
              entering={FadeInDown.delay(450 + index * 100).duration(600)}
              style={styles.chip}
            >
              <Text variant="caption">{feature}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(750).duration(600)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <Button
          onPress={() => router.push('/(auth)/sign-in')}
          fullWidth
          size="lg"
          variant="primary"
          accessibilityLabel="Get started"
          accessibilityHint="Double tap to continue to sign in options"
        >
          Get Started
        </Button>
      </Animated.View>
    </View>
  )
}

export default function Onboarding() {
  return (
    <ScreenErrorBoundary screenName="Onboarding">
      <OnboardingScreen />
    </ScreenErrorBoundary>
  )
}
