import { zodResolver } from '@hookform/resolvers/zod'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
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
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenErrorBoundary } from '@/src/components/error'
import { FormInput } from '@/src/components/forms'
import { Button, Text } from '@/src/components/ui'
import { useAuthStore } from '@/src/features/auth'
import { useColors } from '@/src/hooks/useColors'
import { borderRadius, spacing, type Colors } from '@/src/lib/theme'
import {
  forgotPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordFormData,
  type SignInFormData,
  type SignUpFormData,
} from '@/src/lib/validations/auth'

type ActiveTab = 'signin' | 'signup'

const SEGMENT_PADDING = spacing.xs

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    segmentTrack: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.full,
      padding: SEGMENT_PADDING,
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
    segmentThumb: {
      position: 'absolute',
      top: SEGMENT_PADDING,
      bottom: SEGMENT_PADDING,
      left: SEGMENT_PADDING,
      borderRadius: borderRadius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segment: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    form: {
      gap: spacing.md,
    },
    formHeader: {
      marginBottom: spacing.sm,
    },
    formTitle: {
      marginBottom: spacing.xs,
    },
    forgotPassword: {
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    formNotice: {
      textAlign: 'center',
    },
    dialogOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    dialogCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge,
    },
    dialogContent: {
      gap: spacing.md,
      alignItems: 'center',
    },
    dialogTitle: {
      textAlign: 'center',
    },
    dialogMessage: {
      textAlign: 'center',
    },
    dialogActions: {
      gap: spacing.sm,
      width: '100%',
    },
  })

function EmailAuthScreen() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('signin')
  const [trackWidth, setTrackWidth] = useState(0)

  const signIn = useAuthStore((state) => state.signIn)
  const signUp = useAuthStore((state) => state.signUp)
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const isLoading = useAuthStore((state) => state.isLoading)

  // 0 = sign in, 1 = sign up; drives the segmented-control thumb
  const tabPosition = useSharedValue(0)
  const segmentWidth = Math.max(0, (trackWidth - SEGMENT_PADDING * 2) / 2)

  const selectTab = (tab: ActiveTab) => {
    setFormNotice(null)
    setActiveTab(tab)
    tabPosition.set(withTiming(tab === 'signin' ? 0 : 1, { duration: 220 }))
  }

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPosition.get() * segmentWidth }],
  }))

  // Alert.alert is a no-op on web, so outcomes are also shown inline
  const [formNotice, setFormNotice] = useState<{
    tone: 'danger' | 'success'
    text: string
  } | null>(null)

  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  const resetForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const goBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)/profile')
    }
  }

  const showError = (title: string, error: unknown) => {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    setFormNotice({ tone: 'danger', text: message })
    Alert.alert(title, message)
  }

  const onSignIn = async (data: SignInFormData) => {
    setFormNotice(null)
    try {
      await signIn(data.email, data.password)
    } catch (error) {
      showError('Sign In Failed', error)
    }
  }

  const onSignUp = async (data: SignUpFormData) => {
    setFormNotice(null)
    try {
      await signUp(data.email.trim(), data.password)
      const message = 'We sent you a confirmation link to verify your account.'
      setFormNotice({ tone: 'success', text: message })
      Alert.alert('Check your email', message)
    } catch (error) {
      showError('Sign Up Failed', error)
    }
  }

  const onResetPassword = async (data: ForgotPasswordFormData) => {
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
  }

  const closeResetDialog = () => {
    setShowResetDialog(false)
    setResetSent(false)
    setResetEmail('')
    resetForm.reset({ email: '' })
  }

  const renderSignIn = () => (
    <View style={styles.form}>
      <View style={styles.formHeader}>
        <Text variant="h1" style={styles.formTitle}>
          Welcome back
        </Text>
        <Text variant="body" color="secondary">
          Sign in to continue.
        </Text>
      </View>
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
        size="lg"
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
        <Text variant="bodySmall" color="accent">
          Forgot password?
        </Text>
      </Pressable>
    </View>
  )

  const renderSignUp = () => (
    <View style={styles.form}>
      <View style={styles.formHeader}>
        <Text variant="h1" style={styles.formTitle}>
          Create your account
        </Text>
        <Text variant="body" color="secondary">
          Join us in a few quick steps.
        </Text>
      </View>
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
        textContentType="newPassword"
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
        textContentType="newPassword"
        leftIcon="lock-closed-outline"
      />
      <Button
        onPress={signUpForm.handleSubmit(onSignUp)}
        loading={isLoading || signUpForm.formState.isSubmitting}
        fullWidth
        size="lg"
        accessibilityLabel="Create your account"
      >
        {isLoading || signUpForm.formState.isSubmitting ? 'Creating account...' : 'Sign Up'}
      </Button>
    </View>
  )

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={styles.backRow}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Back to sign in options"
        >
          <Ionicons name="chevron-back" size={18} color={colors.secondary} />
          <Text variant="bodySmall" color="secondary">
            Back
          </Text>
        </Pressable>

        <View
          style={styles.segmentTrack}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          accessibilityRole="tablist"
        >
          {segmentWidth > 0 && (
            <Animated.View
              style={[styles.segmentThumb, { width: segmentWidth }, thumbStyle]}
            />
          )}
          <Pressable
            style={styles.segment}
            onPress={() => selectTab('signin')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'signin' }}
          >
            <Text
              variant="bodySmall"
              weight={activeTab === 'signin' ? 'semibold' : 'normal'}
              color={activeTab === 'signin' ? 'primary' : 'secondary'}
            >
              Sign In
            </Text>
          </Pressable>
          <Pressable
            style={styles.segment}
            onPress={() => selectTab('signup')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'signup' }}
          >
            <Text
              variant="bodySmall"
              weight={activeTab === 'signup' ? 'semibold' : 'normal'}
              color={activeTab === 'signup' ? 'primary' : 'secondary'}
            >
              Sign Up
            </Text>
          </Pressable>
        </View>

        <Animated.View key={activeTab} entering={FadeIn.duration(220)}>
          {activeTab === 'signin' ? renderSignIn() : renderSignUp()}
        </Animated.View>

        {formNotice && (
          <Text
            variant="bodySmall"
            color={formNotice.tone}
            style={styles.formNotice}
            accessibilityRole="alert"
          >
            {formNotice.text}
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={showResetDialog}
        transparent
        animationType="fade"
        onRequestClose={closeResetDialog}
      >
        <Pressable style={styles.dialogOverlay} onPress={closeResetDialog}>
          <Pressable
            style={styles.dialogCard}
            onPress={(event) => event.stopPropagation()}
            accessibilityViewIsModal
          >
            {resetSent ? (
              <Animated.View entering={FadeInDown.duration(250)} style={styles.dialogContent}>
                <Ionicons name="mail-open-outline" size={32} color={colors.success} />
                <Text variant="h2" style={styles.dialogTitle}>
                  Check Your Email
                </Text>
                <Text variant="body" color="secondary" style={styles.dialogMessage}>
                  We&apos;ve sent a reset link to {resetEmail}
                </Text>
                <View style={styles.dialogActions}>
                  <Button onPress={closeResetDialog} fullWidth>
                    Done
                  </Button>
                </View>
              </Animated.View>
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
                  <Button
                    onPress={resetForm.handleSubmit(onResetPassword)}
                    loading={isLoading || resetForm.formState.isSubmitting}
                    fullWidth
                  >
                    {isLoading || resetForm.formState.isSubmitting ? 'Sending...' : 'Send Link'}
                  </Button>
                  <Button onPress={closeResetDialog} variant="ghost" fullWidth>
                    Cancel
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
