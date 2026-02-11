/**
 * Reset Password Screen
 *
 * Handles the deep link callback after a user taps the password-reset email.
 * Supabase can send credentials in several formats depending on the auth flow;
 * this screen handles all common variants (PKCE code, implicit tokens, OTP hash).
 *
 * CONFIG REMINDERS:
 * 1. Deep link scheme: set "scheme" in app.json (currently "yourappname") to
 *    match your Supabase redirect URL (e.g. "myapp").
 * 2. Supabase Dashboard → Authentication → URL Configuration → Redirect URLs:
 *    add "myapp://reset-password" (matching your scheme + this route).
 * 3. This file lives at app/(auth)/reset-password.tsx — Expo Router auto-registers it.
 * 4. The root layout auth guard (app/_layout.tsx) must allow this route for
 *    unauthenticated users (see the `isPasswordReset` check).
 */

import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenErrorBoundary } from '@/src/components/error'
import { Button, Input, Text } from '@/src/components/ui'
import { useAuthStore } from '@/src/features/auth'
import { useColors } from '@/src/hooks/useColors'
import { supabase } from '@/src/lib/supabase'
import { spacing, type Colors } from '@/src/lib/theme'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_PASSWORD_LENGTH = 8

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Status = 'idle' | 'loading' | 'ready' | 'error' | 'updated'

type DeepLinkParams = {
  code?: string
  access_token?: string
  refresh_token?: string
  token?: string
  token_hash?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Coerce an Expo Router param (string | string[] | undefined) to string | undefined. */
function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** True when at least one exchangeable credential is present. */
function hasCredentials(params: DeepLinkParams): boolean {
  return !!(params.code || params.access_token || params.token || params.token_hash)
}

/**
 * Parses both query-string (`?…`) and URL-fragment (`#…`) parameters from a
 * deep link URL. Supabase uses query params for PKCE (`code`) and token-hash
 * flows, and fragments for the implicit flow (`access_token` + `refresh_token`).
 */
function parseDeepLink(url: string): DeepLinkParams {
  const params: DeepLinkParams = {}

  try {
    const queryStart = url.indexOf('?')
    const fragmentStart = url.indexOf('#')

    let queryString = ''
    if (queryStart !== -1) {
      const queryEnd =
        fragmentStart !== -1 && fragmentStart > queryStart
          ? fragmentStart
          : url.length
      queryString = url.substring(queryStart + 1, queryEnd)
    }

    let fragment = ''
    if (fragmentStart !== -1) {
      fragment = url.substring(fragmentStart + 1)
    }

    const keys = [
      'code',
      'access_token',
      'refresh_token',
      'token',
      'token_hash',
    ] as const

    for (const part of [queryString, fragment]) {
      if (!part) continue
      const search = new URLSearchParams(part)
      for (const key of keys) {
        const value = search.get(key)
        if (value) params[key] = value
      }
    }
  } catch {
    // Malformed URL — return empty params so the caller shows an error state.
  }

  return params
}

/** True when the Supabase error looks like an expired or already-used link. */
function isExpiredOrUsedError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('expired') ||
    lower.includes('already used') ||
    lower.includes('otp_expired') ||
    lower.includes('invalid_grant') ||
    lower.includes('invalid token') ||
    lower.includes('invalid otp') ||
    lower.includes('invalid recovery')
  )
}

/**
 * Exchanges deep-link recovery credentials for a Supabase session.
 *
 * Supports three common Supabase flows:
 * 1. **PKCE** — `code` query param → `exchangeCodeForSession`
 * 2. **Implicit** — `access_token` + `refresh_token` in fragment → `setSession`
 * 3. **OTP / token hash** — `token_hash` or `token` param → `verifyOtp`
 */
async function exchangeCredentials(params: DeepLinkParams): Promise<void> {
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code)
    if (error) throw error
    return
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    })
    if (error) throw error
    return
  }

  const otpToken = params.token_hash ?? params.token
  if (otpToken) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: otpToken,
      type: 'recovery',
    })
    if (error) throw error
    return
  }

  throw new Error('No valid recovery credentials found in the link.')
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.xl,
    },
    icon: {
      marginBottom: spacing.sm,
    },
    messageText: {
      textAlign: 'center',
      maxWidth: 300,
    },
    form: {
      gap: spacing.md,
      paddingTop: spacing.xl,
    },
    heading: {
      marginBottom: spacing.xs,
    },
    subtitle: {
      marginBottom: spacing.sm,
    },
  })

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

function ResetPasswordScreen() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const updatePassword = useAuthStore((state) => state.updatePassword)

  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const [canRetry, setCanRetry] = useState(false)

  // Password form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Store last received params so "Retry" can re-process
  const lastParamsRef = useRef<DeepLinkParams | null>(null)

  // Navigation timeout ref for cleanup
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Expo Router search params (primary for query-string params)
  const routerParams = useLocalSearchParams<{
    code?: string
    access_token?: string
    refresh_token?: string
    token?: string
    token_hash?: string
  }>()

  // -----------------------------------------------------------------------
  // Deep link processing
  // -----------------------------------------------------------------------

  const processParams = useCallback(async (params: DeepLinkParams) => {
    lastParamsRef.current = params

    if (!hasCredentials(params)) {
      setStatus('error')
      setErrorMessage('This reset link appears to be incomplete.')
      setCanRetry(false)
      return
    }

    setStatus('loading')
    setErrorMessage('')
    setIsExpired(false)

    try {
      await exchangeCredentials(params)
      setStatus('ready')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to verify the reset link.'
      setStatus('error')
      setErrorMessage(message)
      const expired = isExpiredOrUsedError(message)
      setIsExpired(expired)
      setCanRetry(!expired)
    }
  }, [])

  // Unified deep link resolution: try Expo Router query params first (the
  // canonical source in an Expo Router app), then fall back to the raw URL
  // via the Linking API to handle fragment (#) params from the implicit flow.
  useEffect(() => {
    let mounted = true

    const rpParams: DeepLinkParams = {
      code: asString(routerParams.code),
      access_token: asString(routerParams.access_token),
      refresh_token: asString(routerParams.refresh_token),
      token: asString(routerParams.token),
      token_hash: asString(routerParams.token_hash),
    }

    if (hasCredentials(rpParams)) {
      void processParams(rpParams)
      return
    }

    // Router had no params — try the raw URL for fragment-based tokens.
    Linking.getInitialURL().then((url) => {
      if (url && mounted) {
        const parsed = parseDeepLink(url)
        if (hasCredentials(parsed)) {
          void processParams(parsed)
        }
      }
    })

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (mounted) void processParams(parseDeepLink(url))
    })

    return () => {
      mounted = false
      subscription.remove()
    }
    // Run once on mount — routerParams are available synchronously on first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processParams])

  // Clean up navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current)
    }
  }, [])

  // -----------------------------------------------------------------------
  // Retry handler
  // -----------------------------------------------------------------------

  const handleRetry = useCallback(() => {
    if (lastParamsRef.current) {
      void processParams(lastParamsRef.current)
    }
  }, [processParams])

  // -----------------------------------------------------------------------
  // Password validation & submission
  // -----------------------------------------------------------------------

  const isPasswordValid =
    password.length >= MIN_PASSWORD_LENGTH && password === confirmPassword

  const validateAndSubmit = useCallback(async () => {
    let hasError = false

    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      hasError = true
    } else {
      setPasswordError('')
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match')
      hasError = true
    } else {
      setConfirmError('')
    }

    if (hasError) return

    setIsSubmitting(true)

    try {
      await updatePassword(password)

      setStatus('updated')
      navTimerRef.current = setTimeout(() => {
        router.replace('/(tabs)')
      }, 1500)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update password.'
      setErrorMessage(message)
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }, [password, confirmPassword, router, updatePassword])

  // -----------------------------------------------------------------------
  // Render: Loading
  // -----------------------------------------------------------------------

  const renderLoading = () => (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text variant="body" color="secondary" style={styles.messageText}>
        Verifying your reset link…
      </Text>
    </View>
  )

  // -----------------------------------------------------------------------
  // Render: Error
  // -----------------------------------------------------------------------

  const renderError = () => (
    <Animated.View entering={FadeIn.duration(250)} style={styles.centered}>
      <Ionicons
        name={isExpired ? 'time-outline' : 'alert-circle-outline'}
        size={48}
        color={colors.danger}
        style={styles.icon}
      />
      <Text variant="h2" style={styles.messageText}>
        {isExpired ? 'Link Expired' : 'Something Went Wrong'}
      </Text>
      <Text variant="body" color="secondary" style={styles.messageText}>
        {isExpired
          ? 'This password reset link has expired or has already been used.'
          : errorMessage}
      </Text>

      {canRetry && (
        <Button onPress={handleRetry} variant="outline" fullWidth>
          Retry
        </Button>
      )}

      <Button
        onPress={() => router.replace('/(auth)/email-auth')}
        variant="primary"
        fullWidth
      >
        Request a New Reset Email
      </Button>
    </Animated.View>
  )

  // -----------------------------------------------------------------------
  // Render: Idle (no deep link detected)
  // -----------------------------------------------------------------------

  const renderIdle = () => (
    <Animated.View entering={FadeIn.duration(250)} style={styles.centered}>
      <Ionicons
        name="link-outline"
        size={48}
        color={colors.tertiary}
        style={styles.icon}
      />
      <Text variant="h2" style={styles.messageText}>
        No Reset Link Detected
      </Text>
      <Text variant="body" color="secondary" style={styles.messageText}>
        Open the password reset link from your email to continue.
      </Text>
      <Button
        onPress={() => router.replace('/(auth)/email-auth')}
        variant="primary"
        fullWidth
      >
        Request a New Reset Email
      </Button>
    </Animated.View>
  )

  // -----------------------------------------------------------------------
  // Render: Password form (session established, ready to set new password)
  // -----------------------------------------------------------------------

  const renderForm = () => (
    <Animated.View
      entering={FadeInUp.duration(300)
        .delay(50)
        .withInitialValues({ transform: [{ translateY: 10 }] })}
      style={styles.form}
    >
      <Text variant="h1" style={styles.heading}>
        Set New Password
      </Text>
      <Text variant="body" color="secondary" style={styles.subtitle}>
        Choose a strong password for your account.
      </Text>

      <Input
        label="New Password"
        placeholder="Enter new password"
        secureTextEntry
        autoComplete="new-password"
        leftIcon="lock-closed-outline"
        hint={`Must be at least ${MIN_PASSWORD_LENGTH} characters`}
        value={password}
        onChangeText={(value) => {
          setPassword(value)
          if (passwordError) setPasswordError('')
        }}
        error={passwordError}
      />

      <Input
        label="Confirm Password"
        placeholder="Re-enter new password"
        secureTextEntry
        autoComplete="new-password"
        leftIcon="lock-closed-outline"
        value={confirmPassword}
        onChangeText={(value) => {
          setConfirmPassword(value)
          if (confirmError) setConfirmError('')
        }}
        error={confirmError}
      />

      <Button
        onPress={validateAndSubmit}
        loading={isSubmitting}
        disabled={!isPasswordValid}
        fullWidth
      >
        {isSubmitting ? 'Updating…' : 'Update Password'}
      </Button>
    </Animated.View>
  )

  // -----------------------------------------------------------------------
  // Render: Success (password updated)
  // -----------------------------------------------------------------------

  const renderUpdated = () => (
    <Animated.View entering={FadeIn.duration(250)} style={styles.centered}>
      <Ionicons
        name="checkmark-circle-outline"
        size={56}
        color={colors.success}
        style={styles.icon}
      />
      <Text variant="h2" style={styles.messageText}>
        Password Updated
      </Text>
      <Text variant="body" color="secondary" style={styles.messageText}>
        Your password has been changed. Redirecting…
      </Text>
    </Animated.View>
  )

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {status === 'idle' && renderIdle()}
        {status === 'loading' && renderLoading()}
        {status === 'error' && renderError()}
        {status === 'ready' && renderForm()}
        {status === 'updated' && renderUpdated()}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ---------------------------------------------------------------------------
// Export with error boundary
// ---------------------------------------------------------------------------

export default function ResetPassword() {
  return (
    <ScreenErrorBoundary screenName="Reset Password">
      <ResetPasswordScreen />
    </ScreenErrorBoundary>
  )
}
