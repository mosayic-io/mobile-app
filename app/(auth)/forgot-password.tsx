import { Link, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Button, Text } from '@/src/components/ui'
import { FormInput } from '@/src/components/forms'
import { useColors } from '@/src/hooks/useColors'
import { spacing, type Colors } from '@/src/lib/theme'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/src/lib/validations/auth'
import { useAuthStore } from '@/src/features/auth'
import { ScreenErrorBoundary } from '@/src/components/error'

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
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing.lg,
    },
    successIcon: {
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    successTitle: {
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    successMessage: {
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
  })

function SuccessView({ email, onBackToSignIn }: { email: string; onBackToSignIn: () => void }) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons
          name="mail-open-outline"
          size={64}
          color={colors.success}
          style={styles.successIcon}
        />
        <Text variant="h1" style={styles.successTitle}>
          Check Your Email
        </Text>
        <Text variant="body" color="secondary" style={styles.successMessage}>
          We&apos;ve sent a password reset link to {email}
        </Text>

        <Button
          onPress={onBackToSignIn}
          fullWidth
          accessibilityLabel="Go back to sign in"
          accessibilityHint="Double tap to return to the sign in screen"
        >
          Back to Sign In
        </Button>
      </View>
    </View>
  )
}

function ForgotPasswordScreen() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const router = useRouter()

  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const resetPassword = useAuthStore((state) => state.resetPassword)
  const isLoading = useAuthStore((state) => state.isLoading)

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const loading = isLoading || isSubmitting

  const onSubmit = useCallback(
    async (data: ForgotPasswordFormData) => {
      try {
        await resetPassword(data.email)
        setSentEmail(data.email)
        setSent(true)
      } catch (error) {
        Alert.alert(
          'Reset Failed',
          error instanceof Error ? error.message : 'Failed to send reset email'
        )
      }
    },
    [resetPassword]
  )

  const handleBackToSignIn = useCallback(() => {
    router.replace('/(auth)/sign-in')
  }, [router])

  if (sent) {
    return <SuccessView email={sentEmail} onBackToSignIn={handleBackToSignIn} />
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text variant="h1" style={{ marginBottom: spacing.sm }}>
          Reset Password
        </Text>
        <Text variant="body" color="secondary" style={{ marginBottom: spacing.xl }}>
          Enter your email and we&apos;ll send you a reset link
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

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            accessibilityLabel="Send password reset link"
            accessibilityHint="Double tap to receive a password reset email"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" color="secondary">
            Remember your password?{' '}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              accessibilityHint="Double tap to go back to sign in"
            >
              <Text variant="bodySmall" color="accent" weight="semibold">
                Sign In
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

export default function ForgotPassword() {
  return (
    <ScreenErrorBoundary screenName="Forgot Password">
      <ForgotPasswordScreen />
    </ScreenErrorBoundary>
  )
}
