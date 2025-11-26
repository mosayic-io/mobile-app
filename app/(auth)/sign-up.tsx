import { Link } from 'expo-router'
import { useCallback, useMemo } from 'react'
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

import { Button, Text } from '@/src/components/ui'
import { FormInput } from '@/src/components/forms'
import { useColors } from '@/src/hooks/useColors'
import { spacing, type Colors } from '@/src/lib/theme'
import { signUpSchema, type SignUpFormData } from '@/src/lib/validations/auth'
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
  })

function SignUpScreen() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  const signUp = useAuthStore((state) => state.signUp)
  const isLoading = useAuthStore((state) => state.isLoading)

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const loading = isLoading || isSubmitting

  const onSubmit = useCallback(
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
      style={styles.container}
    >
      <View style={styles.content}>
        <Text variant="h1" style={{ marginBottom: spacing.sm }}>
          Create Account
        </Text>
        <Text variant="body" color="secondary" style={{ marginBottom: spacing.xl }}>
          Sign up to get started
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
            placeholder="Create a password"
            secureTextEntry
            autoComplete="new-password"
            leftIcon="lock-closed-outline"
            hint="Must be at least 6 characters"
          />

          <FormInput
            control={control}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
            secureTextEntry
            autoComplete="new-password"
            leftIcon="lock-closed-outline"
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            accessibilityLabel="Create your account"
            accessibilityHint="Double tap to sign up with your email and password"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" color="secondary">
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              accessibilityHint="Double tap to sign in to your existing account"
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

export default function SignUp() {
  return (
    <ScreenErrorBoundary screenName="Sign Up">
      <SignUpScreen />
    </ScreenErrorBoundary>
  )
}
