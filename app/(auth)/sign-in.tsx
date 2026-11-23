import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenErrorBoundary } from '@/src/components/error'
import { Button, Text } from '@/src/components/ui'
import { useAuthStore } from '@/src/features/auth'
import { useColors } from '@/src/hooks/useColors'
import { errorMessage } from '@/src/lib/feedback'
import { spacing, type Colors } from '@/src/lib/theme'

const GOOGLE_ICON_SOURCE = require('../../assets/images/google.png')

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
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing.sm,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: spacing.md,
    },
    backButton: {
      marginTop: spacing.xl,
      alignItems: 'center',
    },
    errorText: {
      textAlign: 'center',
    },
    socialIcon: {
      width: 18,
      height: 18,
    },
  })

function SignInScreen() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const signIn = useAuthStore((state) => state.signIn)

  // Which provider's sheet is open; every button waits while one is
  const [pending, setPending] = useState<'google' | 'apple' | null>(null)

  // Failures show inline, under the buttons, on every platform
  const [failure, setFailure] = useState<string | null>(null)

  const goBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)/profile')
    }
  }

  // Signed in: the auth layout hands back to Profile. Cancelled: nothing to say.
  const signInWithProvider = async (provider: 'google' | 'apple') => {
    setFailure(null)
    setPending(provider)
    try {
      await signIn({ provider })
    } catch (error) {
      setFailure(errorMessage(error))
    } finally {
      setPending(null)
    }
  }

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
    >
      <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
        <Text variant="h1" style={styles.headerTitle}>
          Let&apos;s get you signed in
        </Text>
        <Text variant="body" color="secondary">
          Choose how you&apos;d like to continue
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(150).duration(400)}
        style={styles.buttons}
      >
        <Button
          variant="outline"
          onPress={() => signInWithProvider('google')}
          disabled={pending !== null}
          loading={pending === 'google'}
          fullWidth
          size="lg"
          leftIcon={<Image source={GOOGLE_ICON_SOURCE} style={styles.socialIcon} />}
          accessibilityLabel="Continue with Google"
          accessibilityHint="Double tap to sign in with your Google account"
        >
          Continue with Google
        </Button>

        {Platform.OS === 'ios' && (
          <Button
            variant="outline"
            onPress={() => signInWithProvider('apple')}
            disabled={pending !== null}
            loading={pending === 'apple'}
            fullWidth
            size="lg"
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
          onPress={() => router.push('/(auth)/email-auth')}
          disabled={pending !== null}
          fullWidth
          size="lg"
          leftIcon={<Ionicons name="mail-outline" size={18} color={colors.background} />}
          accessibilityLabel="Continue with Email"
          accessibilityHint="Double tap to sign in with your email address"
        >
          Continue with Email
        </Button>

        {failure && (
          <Text
            variant="bodySmall"
            color="danger"
            style={styles.errorText}
            accessibilityRole="alert"
          >
            {failure}
          </Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <Pressable
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text variant="bodySmall" color="secondary">
            Back
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}

export default function SignIn() {
  return (
    <ScreenErrorBoundary screenName="Sign In">
      <SignInScreen />
    </ScreenErrorBoundary>
  )
}
