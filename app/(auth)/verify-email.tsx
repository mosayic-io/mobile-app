import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { AppState, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenErrorBoundary } from '@/src/components/error'
import { Button, Text } from '@/src/components/ui'
import { useAuthStore } from '@/src/features/auth'
import { useColors } from '@/src/hooks/useColors'
import { spacing, type Colors } from '@/src/lib/theme'

// The waiting state after an email sign-up, only ever reached when email
// confirmation is switched ON in Supabase (it ships off). The confirmation
// link opens the links site's /email-confirmed page; when the person comes
// back here, the app signs them in with the password they signed up with
// (held in memory by the auth store). A cold start loses that password, and
// then they sign in by hand.

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.background,
    },
    header: {
      marginBottom: spacing.xl,
    },
    headerTitle: {
      marginBottom: spacing.sm,
    },
    buttons: {
      gap: spacing.md,
    },
    notice: {
      textAlign: 'center',
    },
  })

function VerifyEmailScreen() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const email = useAuthStore((state) => state.pendingVerificationEmail)
  const resendVerification = useAuthStore((state) => state.resendVerification)
  const completeVerification = useAuthStore((state) => state.completeVerification)
  const clearPendingVerification = useAuthStore((state) => state.clearPendingVerification)
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false)

  // Back from the email app or the browser: try to sign in quietly. On
  // success the auth layout hands back to Profile.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') completeVerification().catch(() => {})
    })
    return () => subscription.remove()
  }, [completeVerification])

  const signInByHand = () => {
    clearPendingVerification()
    router.replace('/(auth)/email-auth')
  }

  const confirmed = async () => {
    setChecking(true)
    setNotice(null)
    try {
      if (await completeVerification()) return
      // The password is gone (a cold start) — nothing to sign in with.
      if (!useAuthStore.getState().pendingVerificationEmail) return signInByHand()
      setNotice({ tone: 'danger', text: 'Your email is not confirmed yet. Open the link in the email first.' })
    } catch {
      signInByHand()
    } finally {
      setChecking(false)
    }
  }

  const resend = async () => {
    if (!email) return
    setSending(true)
    setNotice(null)
    try {
      await resendVerification(email)
      setNotice({ tone: 'success', text: `We sent another confirmation email to ${email}.` })
    } catch (error) {
      setNotice({ tone: 'danger', text: error instanceof Error ? error.message : 'Could not send the email again.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.header}>
        <Text variant="h1" style={styles.headerTitle}>
          Confirm your email
        </Text>
        <Text variant="body" color="secondary">
          We sent a confirmation link to {email ?? 'your address'}. Open it, then come back here and you will be signed in.
        </Text>
      </View>

      <View style={styles.buttons}>
        <Button onPress={confirmed} loading={checking} fullWidth size="lg" accessibilityLabel="I have confirmed my email">
          I have confirmed my email
        </Button>
        <Button onPress={resend} variant="outline" loading={sending} disabled={!email} fullWidth accessibilityLabel="Send the email again">
          Send the email again
        </Button>
        <Button onPress={signInByHand} variant="ghost" fullWidth accessibilityLabel="Sign in another way">
          Sign in another way
        </Button>
        {notice ? (
          <Text variant="bodySmall" color={notice.tone} style={styles.notice} accessibilityRole="alert">
            {notice.text}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

export default function VerifyEmail() {
  return (
    <ScreenErrorBoundary screenName="Verify email">
      <VerifyEmailScreen />
    </ScreenErrorBoundary>
  )
}
