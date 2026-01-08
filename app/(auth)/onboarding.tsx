import { zodResolver } from '@hookform/resolvers/zod'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import PagerView from 'react-native-pager-view'

import { ScreenErrorBoundary } from '@/src/components/error'
import { FormInput } from '@/src/components/forms'
import { Button, Text } from '@/src/components/ui'
import { useAuthStore } from '@/src/features/auth'
import { useColors } from '@/src/hooks/useColors'
import { spacing, borderRadius, type Colors } from '@/src/lib/theme'
import {
  signInSchema,
  signUpSchema,
  type SignInFormData,
  type SignUpFormData,
} from '@/src/lib/validations/auth'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Customize these gradient colors to match your brand
const WELCOME_GRADIENT_COLORS = ['#4F46E5', '#7C3AED', '#9333EA'] as const

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
    emailAuthContent: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
    },
    formContainer: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
    },
    form: {
      gap: spacing.md,
    },
    backButton: {
      marginTop: spacing.lg,
      alignItems: 'center',
    },
    forgotPassword: {
      alignItems: 'center',
      marginTop: spacing.sm,
    },
  })

// ============================================================================
// Welcome Page Component
// ============================================================================
function WelcomePage({
  onGetStarted,
}: {
  onGetStarted: () => void
}) {
  return (
    <LinearGradient
      colors={WELCOME_GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={welcomeStyles.container}
    >
      <View style={welcomeStyles.content}>
        <View style={welcomeStyles.header}>
          {/* Replace with your logo */}
          <View style={welcomeStyles.logoPlaceholder}>
            <Text variant="h1" style={{ color: '#fff' }}>
              Logo
            </Text>
          </View>
        </View>

        <View style={welcomeStyles.footer}>
          <Text variant="h1" style={welcomeStyles.title}>
            Welcome to Your App
          </Text>
          <Text variant="body" style={welcomeStyles.subtitle}>
            This is placeholder copy for your onboarding experience.
            Customize this text to match your app's value proposition.
          </Text>
          <Button
            onPress={onGetStarted}
            fullWidth
            variant="outline"
            style={welcomeStyles.button}
            accessibilityLabel="Get started"
            accessibilityHint="Double tap to continue to sign in options"
          >
            Get Started
          </Button>
        </View>
      </View>
    </LinearGradient>
  )
}

const welcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 3,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {},
  title: {
    color: '#fff',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: spacing.xl,
  },
  button: {
    borderColor: '#fff',
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
// Email Auth Page Component (with Login/Sign Up tabs)
// ============================================================================
function EmailAuthPage({
  onBack,
  colors,
}: {
  onBack: () => void
  colors: Colors
}) {
  const styles = useMemo(() => createStyles(colors), [colors])
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')

  const signIn = useAuthStore((state) => state.signIn)
  const signUp = useAuthStore((state) => state.signUp)
  const isLoading = useAuthStore((state) => state.isLoading)

  // Login form
  const loginForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  // Sign up form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const loading = isLoading || loginForm.formState.isSubmitting || signUpForm.formState.isSubmitting

  const onLogin = useCallback(
    async (data: SignInFormData) => {
      try {
        await signIn(data.email, data.password)
      } catch (error) {
        Alert.alert(
          'Sign In Failed',
          error instanceof Error ? error.message : 'An unexpected error occurred'
        )
      }
    },
    [signIn]
  )

  const onSignUp = useCallback(
    async (data: SignUpFormData) => {
      try {
        await signUp(data.email, data.password)
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link to verify your account.'
        )
      } catch (error) {
        Alert.alert(
          'Sign Up Failed',
          error instanceof Error ? error.message : 'An unexpected error occurred'
        )
      }
    },
    [signUp]
  )

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.page, styles.emailAuthContent]}
    >
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
          onPress={() => setActiveTab('login')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'login' }}
        >
          <Text
            variant="body"
            weight={activeTab === 'login' ? 'semibold' : 'normal'}
            color={activeTab === 'login' ? 'accent' : 'secondary'}
          >
            Sign In
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
          onPress={() => setActiveTab('signup')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'signup' }}
        >
          <Text
            variant="body"
            weight={activeTab === 'signup' ? 'semibold' : 'normal'}
            color={activeTab === 'signup' ? 'accent' : 'secondary'}
          >
            Sign Up
          </Text>
        </Pressable>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        {activeTab === 'login' ? (
          <View style={styles.form}>
            <FormInput
              control={loginForm.control}
              name="email"
              label="Email"
              placeholder="Enter your email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              leftIcon="mail-outline"
            />
            <FormInput
              control={loginForm.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              leftIcon="lock-closed-outline"
            />
            <Button
              onPress={loginForm.handleSubmit(onLogin)}
              loading={loading}
              fullWidth
              accessibilityLabel="Sign in to your account"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Pressable
              style={styles.forgotPassword}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
            >
              <Text variant="bodySmall" color="secondary">
                Forgot password?
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <FormInput
              control={signUpForm.control}
              name="email"
              label="Email"
              placeholder="Enter your email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              leftIcon="mail-outline"
            />
            <FormInput
              control={signUpForm.control}
              name="password"
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              hint="Must be at least 6 characters"
            />
            <FormInput
              control={signUpForm.control}
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
            />
            <Button
              onPress={signUpForm.handleSubmit(onSignUp)}
              loading={loading}
              fullWidth
              accessibilityLabel="Create your account"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </View>
        )}

        <Pressable
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to sign in options"
        >
          <Text variant="bodySmall" color="secondary">
            Back to sign in options
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

// ============================================================================
// Main Onboarding Screen
// ============================================================================
function OnboardingScreen() {
  const colors = useColors()
  const pagerRef = useRef<PagerView>(null)

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

  return (
    <PagerView
      ref={pagerRef}
      style={{ flex: 1 }}
      initialPage={0}
      scrollEnabled={false}
    >
      {/* Page 0: Welcome */}
      <View key="welcome" style={{ flex: 1 }}>
        <WelcomePage onGetStarted={() => goToPage(1)} />
      </View>

      {/* Page 1: Auth Method Selection */}
      <View key="auth-method" style={{ flex: 1 }}>
        <AuthMethodPage
          onContinueWithEmail={() => goToPage(2)}
          onContinueWithGoogle={onGoogleSignIn}
          onContinueWithApple={onAppleSignIn}
          onBack={() => goToPage(0)}
          isLoading={isLoading}
          colors={colors}
        />
      </View>

      {/* Page 2: Email Auth (Login/Sign Up tabs) */}
      <View key="email-auth" style={{ flex: 1 }}>
        <EmailAuthPage
          onBack={() => goToPage(1)}
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
