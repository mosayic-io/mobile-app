import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenErrorBoundary } from '@/src/components/error'
import { FormInput } from '@/src/components/forms'
import { Button, Input, Text } from '@/src/components/ui'
import { useAuthStore } from '@/src/features/auth'
import { useColors } from '@/src/hooks/useColors'
import { spacing, type Colors } from '@/src/lib/theme'
import {
  forgotPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordFormData,
  type SignInFormData,
} from '@/src/lib/validations/auth'

type ActiveTab = 'signin' | 'signup'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
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
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      height: 2,
      width: '50%',
      backgroundColor: colors.accent,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      gap: spacing.lg,
    },
    form: {
      gap: spacing.md,
    },
    forgotPassword: {
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    backButton: {
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    dialogOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    dialogCard: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: spacing.lg,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 8,
    },
    dialogContent: {
      gap: spacing.md,
    },
    dialogTitle: {
      textAlign: 'center',
    },
    dialogMessage: {
      textAlign: 'center',
    },
    dialogActions: {
      gap: spacing.sm,
    },
  })

function EmailAuthScreen() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('signin')

  const signIn = useAuthStore((state) => state.signIn)
  const signUp = useAuthStore((state) => state.signUp)
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const isLoading = useAuthStore((state) => state.isLoading)

  const tabOffset = useSharedValue(0)

  useEffect(() => {
    tabOffset.value = withTiming(activeTab === 'signin' ? 0 : 1, { duration: 250 })
  }, [activeTab, tabOffset])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabOffset.value * (SCREEN_WIDTH / 2) }],
  }))

  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const signUpEmailRef = useRef('')
  const signUpPasswordRef = useRef('')
  const signUpConfirmRef = useRef('')
  const [signUpErrors, setSignUpErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  const [isSignUpSubmitting, setIsSignUpSubmitting] = useState(false)

  const resetForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSignIn = useCallback(
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

  const onSignUp = useCallback(async () => {
    const payload = {
      email: signUpEmailRef.current.trim(),
      password: signUpPasswordRef.current,
      confirmPassword: signUpConfirmRef.current,
    }

    const result = signUpSchema.safeParse(payload)
    if (!result.success) {
      const nextErrors: typeof signUpErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (field && typeof field === 'string') {
          nextErrors[field as keyof typeof nextErrors] = issue.message
        }
      }
      setSignUpErrors(nextErrors)
      return
    }

    setSignUpErrors({})
    setIsSignUpSubmitting(true)
    try {
      await signUp(payload.email, payload.password)
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link to verify your account.'
      )
    } catch (error) {
      Alert.alert(
        'Sign Up Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    } finally {
      setIsSignUpSubmitting(false)
    }
  }, [signUp])

  const onResetPassword = useCallback(
    async (data: ForgotPasswordFormData) => {
      try {
        await resetPassword(data.email)
        setResetEmail(data.email)
        setResetSent(true)
      } catch (error) {
        Alert.alert(
          'Reset Failed',
          error instanceof Error ? error.message : 'Failed to send reset email'
        )
      }
    },
    [resetPassword]
  )

  const closeResetDialog = useCallback(() => {
    setShowResetDialog(false)
    setResetSent(false)
    setResetEmail('')
    resetForm.reset({ email: '' })
  }, [resetForm])

  const renderSignIn = () => (
    <View style={styles.form}>
      <Text variant="h1">Welcome back</Text>
      <Text variant="body" color="secondary">
        Sign in to continue.
      </Text>
      <FormInput
        control={signInForm.control}
        name="email"
        label="Email"
        placeholder="Enter your email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        leftIcon="mail-outline"
      />
      <FormInput
        control={signInForm.control}
        name="password"
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
        autoComplete="password"
        leftIcon="lock-closed-outline"
      />
      <Button
        onPress={signInForm.handleSubmit(onSignIn)}
        loading={isLoading || signInForm.formState.isSubmitting}
        fullWidth
        accessibilityLabel="Sign in to your account"
      >
        {isLoading || signInForm.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
      </Button>
      <Pressable
        style={styles.forgotPassword}
        accessibilityRole="button"
        accessibilityLabel="Forgot password"
        accessibilityHint="Double tap to reset your password"
        onPress={() => setShowResetDialog(true)}
      >
        <Text variant="bodySmall" color="secondary">
          Forgot password?
        </Text>
      </Pressable>
    </View>
  )

  const renderSignUp = () => (
    <View style={styles.form}>
      <Text variant="h1">Create your account</Text>
      <Text variant="body" color="secondary">
        Join us in a few quick steps.
      </Text>
      <Input
        label="Email"
        placeholder="Enter your email"
        autoCapitalize="none"
        autoComplete="off"
        textContentType="none"
        autoCorrect={false}
        spellCheck={false}
        importantForAutofill="no"
        keyboardType="email-address"
        leftIcon="mail-outline"
        onChangeText={(value) => {
          signUpEmailRef.current = value
          if (signUpErrors.email) {
            setSignUpErrors((prev) => ({ ...prev, email: undefined }))
          }
        }}
        error={signUpErrors.email}
      />
      <Input
        label="Password"
        placeholder="Create a password"
        secureTextEntry
        autoComplete="off"
        textContentType="none"
        autoCorrect={false}
        spellCheck={false}
        importantForAutofill="no"
        leftIcon="lock-closed-outline"
        hint="Must be at least 6 characters"
        onChangeText={(value) => {
          signUpPasswordRef.current = value
          if (signUpErrors.password) {
            setSignUpErrors((prev) => ({ ...prev, password: undefined }))
          }
        }}
        error={signUpErrors.password}
      />
      <Input
        label="Confirm Password"
        placeholder="Confirm your password"
        secureTextEntry
        autoComplete="off"
        textContentType="none"
        autoCorrect={false}
        spellCheck={false}
        importantForAutofill="no"
        leftIcon="lock-closed-outline"
        onChangeText={(value) => {
          signUpConfirmRef.current = value
          if (signUpErrors.confirmPassword) {
            setSignUpErrors((prev) => ({ ...prev, confirmPassword: undefined }))
          }
        }}
        error={signUpErrors.confirmPassword}
      />
      <Button
        onPress={onSignUp}
        loading={isLoading || isSignUpSubmitting}
        fullWidth
        accessibilityLabel="Create your account"
      >
        {isLoading || isSignUpSubmitting ? 'Creating account...' : 'Sign Up'}
      </Button>
    </View>
  )

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.tabContainer,
            { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.sm },
          ]}
        >
          <Pressable
            style={styles.tab}
            onPress={() => setActiveTab('signin')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'signin' }}
          >
            <Text
              variant="body"
              weight={activeTab === 'signin' ? 'semibold' : 'normal'}
              color={activeTab === 'signin' ? 'accent' : 'secondary'}
            >
              Sign In
            </Text>
          </Pressable>
          <Pressable
            style={styles.tab}
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
          <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
        </View>

        <Animated.View entering={FadeInUp.duration(300).delay(50).withInitialValues({ transform: [{ translateY: 10 }] })} style={styles.content}>
          <Animated.View key={activeTab} entering={FadeIn.duration(200)}>
            {activeTab === 'signin' ? renderSignIn() : renderSignUp()}
          </Animated.View>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to sign in options"
          >
            <Text variant="bodySmall" color="secondary">
              Back to sign in options
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showResetDialog}
        transparent
        animationType="fade"
        onRequestClose={closeResetDialog}
      >
        <Pressable style={styles.dialogOverlay} onPress={closeResetDialog}>
          <Pressable
            style={[styles.dialogCard, { marginTop: insets.top + spacing.lg }]}
            onPress={(event) => event.stopPropagation()}
            accessibilityRole="dialog"
          >
            {resetSent ? (
              <View style={styles.dialogContent}>
                <Ionicons name="mail-open-outline" size={32} color={colors.success} />
                <Text variant="h2" style={styles.dialogTitle}>
                  Check Your Email
                </Text>
                <Text variant="body" color="secondary" style={styles.dialogMessage}>
                  We&apos;ve sent a reset link to {resetEmail}
                </Text>
                <Button onPress={closeResetDialog} fullWidth>
                  Done
                </Button>
              </View>
            ) : (
              <View style={styles.dialogContent}>
                <Text variant="h2" style={styles.dialogTitle}>
                  Reset Password
                </Text>
                <Text variant="body" color="secondary" style={styles.dialogMessage}>
                  Enter your email and we&apos;ll send you a reset link.
                </Text>
                <FormInput
                  control={resetForm.control}
                  name="email"
                  label="Email"
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  leftIcon="mail-outline"
                />
                <View style={styles.dialogActions}>
                  <Button onPress={closeResetDialog} variant="ghost" fullWidth>
                    Cancel
                  </Button>
                  <Button
                    onPress={resetForm.handleSubmit(onResetPassword)}
                    loading={isLoading || resetForm.formState.isSubmitting}
                    fullWidth
                  >
                    {isLoading || resetForm.formState.isSubmitting ? 'Sending...' : 'Send Link'}
                  </Button>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  )
}

export default function EmailAuth() {
  return (
    <ScreenErrorBoundary screenName="Email Auth">
      <EmailAuthScreen />
    </ScreenErrorBoundary>
  )
}
