import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useRef } from 'react'
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import PagerView from 'react-native-pager-view'
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg'

import { ScreenErrorBoundary } from '@/src/components/error'
import { Button, Text } from '@/src/components/ui'
import { useAuthStore } from '@/src/features/auth'
import { useColors } from '@/src/hooks/useColors'
import { spacing, type Colors } from '@/src/lib/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const GOOGLE_ICON_SOURCE = require('../../assets/images/google.png')

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    page: {
      flex: 1,
      width: SCREEN_WIDTH,
    },
    authMethodContent: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.background,
    },
    authMethodHeader: {
      marginBottom: spacing.xl,
    },
    authMethodButtons: {
      gap: spacing.md,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: spacing.md,
    },
    backButton: {
      marginTop: spacing.lg,
      alignItems: 'center',
    },
    socialIcon: {
      width: 18,
      height: 18,
    },
  })

// ============================================================================
// Welcome Page Component
// ============================================================================
function WelcomePage({
  onGetStarted,
  colors,
}: {
  onGetStarted: () => void
  colors: Colors
}) {
  const styles = useMemo(() => createWelcomeStyles(colors), [colors])

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" style={styles.background}>
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
        <Text variant="h1" style={styles.title}>
          Welcome to Your App
        </Text>
        <Text variant="body" style={styles.subtitle}>
          This is placeholder copy for your onboarding experience.
          Customize this text to match your app&apos;s value proposition.
        </Text>
        <Button
          onPress={onGetStarted}
          fullWidth
          variant="primary"
          accessibilityLabel="Get started"
          accessibilityHint="Double tap to continue to sign in options"
        >
          Get Started
        </Button>
      </View>
    </View>
  )
}

const createWelcomeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    background: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    title: {
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.secondary,
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
  })

// ============================================================================
// Auth Method Selection Page Component
// ============================================================================
function AuthMethodPage({
  onContinueWithEmail,
  onContinueWithGoogle,
  onContinueWithApple,
  onBack,
  isLoading,
  colors,
}: {
  onContinueWithEmail: () => void
  onContinueWithGoogle: () => void
  onContinueWithApple: () => void
  onBack: () => void
  isLoading: boolean
  colors: Colors
}) {
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={[styles.page, styles.authMethodContent]}>
      <View style={styles.authMethodHeader}>
        <Text variant="h1" style={{ marginBottom: spacing.sm }}>
          How would you like to continue?
        </Text>
        <Text variant="body" color="secondary">
          Choose your preferred sign in method
        </Text>
      </View>

      <View style={styles.authMethodButtons}>
        <Button
          variant="outline"
          onPress={onContinueWithGoogle}
          disabled={isLoading}
          fullWidth
          leftIcon={<Image source={GOOGLE_ICON_SOURCE} style={styles.socialIcon} />}
          accessibilityLabel="Continue with Google"
          accessibilityHint="Double tap to sign in with your Google account"
        >
          Continue with Google
        </Button>

        {Platform.OS === 'ios' && (
          <Button
            variant="outline"
            onPress={onContinueWithApple}
            disabled={isLoading}
            fullWidth
            leftIcon={<Ionicons name="logo-apple" size={18} color={colors.text} />}
            accessibilityLabel="Continue with Apple"
            accessibilityHint="Double tap to sign in with your Apple account"
          >
            Continue with Apple
          </Button>
        )}

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text variant="bodySmall" color="secondary" style={styles.dividerText}>
            or
          </Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          variant="primary"
          onPress={onContinueWithEmail}
          disabled={isLoading}
          fullWidth
          accessibilityLabel="Continue with Email"
          accessibilityHint="Double tap to sign in with your email address"
        >
          Continue with Email
        </Button>
      </View>

      <Pressable
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text variant="bodySmall" color="secondary">
          Back
        </Text>
      </Pressable>
    </View>
  )
}

// ============================================================================
// Main Onboarding Screen
// ============================================================================
function OnboardingScreen() {
  const colors = useColors()
  const pagerRef = useRef<PagerView>(null)
  const router = useRouter()

  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)
  const signInWithApple = useAuthStore((state) => state.signInWithApple)
  const isLoading = useAuthStore((state) => state.isLoading)

  const goToPage = useCallback((page: number) => {
    pagerRef.current?.setPage(page)
  }, [])

  const onGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      Alert.alert(
        'Google Sign In Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }, [signInWithGoogle])

  const onAppleSignIn = useCallback(async () => {
    try {
      await signInWithApple()
    } catch (error) {
      if (error instanceof Error && error.message === 'Sign in was cancelled') {
        return
      }
      Alert.alert(
        'Apple Sign In Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }, [signInWithApple])

  const onContinueWithEmail = useCallback(() => {
    router.push('/(auth)/email-auth')
  }, [router])

  return (
    <PagerView
      ref={pagerRef}
      style={{ flex: 1 }}
      initialPage={0}
      scrollEnabled={false}
    >
      {/* Page 0: Welcome */}
      <View key="welcome" style={{ flex: 1 }}>
        <WelcomePage onGetStarted={() => goToPage(1)} colors={colors} />
      </View>

      {/* Page 1: Auth Method Selection */}
      <View key="auth-method" style={{ flex: 1 }}>
        <AuthMethodPage
          onContinueWithEmail={onContinueWithEmail}
          onContinueWithGoogle={onGoogleSignIn}
          onContinueWithApple={onAppleSignIn}
          onBack={() => goToPage(0)}
          isLoading={isLoading}
          colors={colors}
        />
      </View>
    </PagerView>
  )
}

export default function Onboarding() {
  return (
    <ScreenErrorBoundary screenName="Onboarding">
      <OnboardingScreen />
    </ScreenErrorBoundary>
  )
}
