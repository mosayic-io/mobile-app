import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'

import { ScreenErrorBoundary } from '@/src/components/error'
import { FormInput } from '@/src/components/forms'
import { Button, Text } from '@/src/components/ui'
import { useAuthStore } from '@/src/features/auth'
import { useColors } from '@/src/hooks/useColors'
import { spacing, type Colors } from '@/src/lib/theme'
import { signInSchema, type SignInFormData } from '@/src/lib/validations/auth'

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    form: {
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
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    forgotPassword: {
      alignItems: 'center',
      marginTop: spacing.sm,
    },
  })

function SignInScreen() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  const signIn = useAuthStore((state) => state.signIn)
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)
  const signInWithApple = useAuthStore((state) => state.signInWithApple)
  const isLoading = useAuthStore((state) => state.isLoading)

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loading = isLoading || isSubmitting

  const onSubmit = useCallback(
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
      // Don't show alert for user cancellation
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text variant="h1" style={{ marginBottom: spacing.sm }}>
          Welcome Back
        </Text>
        <Text variant="body" color="secondary" style={{ marginBottom: spacing.xl }}>
          Sign in to your account
        </Text>

        <View style={styles.form}>
          <FormInput
            control={control}
            name="email"
            label="Email"
            placeholder="Enter your email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            leftIcon="mail-outline"
          />

          <FormInput
            control={control}
            name="password"
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            autoComplete="password"
            leftIcon="lock-closed-outline"
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            accessibilityLabel="Sign in to your account"
            accessibilityHint="Double tap to sign in with your email and password"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable
              style={styles.forgotPassword}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
              accessibilityHint="Double tap to reset your password"
            >
              <Text variant="bodySmall" color="secondary">
                Forgot password?
              </Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text variant="bodySmall" color="secondary" style={styles.dividerText}>
            or continue with
          </Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          variant="outline"
          onPress={onGoogleSignIn}
          disabled={loading}
          fullWidth
          accessibilityLabel="Sign in with Google"
          accessibilityHint="Double tap to sign in with your Google account"
        >
          Continue with Google
        </Button>

        {Platform.OS === 'ios' && (
          <Button
            variant="outline"
            onPress={onAppleSignIn}
            disabled={loading}
            fullWidth
            style={{ marginTop: spacing.sm }}
            accessibilityLabel="Sign in with Apple"
            accessibilityHint="Double tap to sign in with your Apple account"
          >
            Continue with Apple
          </Button>
        )}

        <View style={styles.footer}>
          <Text variant="bodySmall" color="secondary">
            Don&apos;t have an account?{' '}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Sign up"
              accessibilityHint="Double tap to create a new account"
            >
              <Text variant="bodySmall" color="accent" weight="semibold">
                Sign Up
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

export default function SignIn() {
  return (
    <ScreenErrorBoundary screenName="Sign In">
      <SignInScreen />
    </ScreenErrorBoundary>
  )
}
