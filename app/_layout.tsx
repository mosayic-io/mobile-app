import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, type PropsWithChildren } from 'react'
import {
  AppState,
  type AppStateStatus,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaInsetsContext, SafeAreaProvider } from 'react-native-safe-area-context'

import { queryClient } from '@/src/lib/queryClient'
import { useAuthStore } from '@/src/features/auth'
import { useColors } from '@/src/hooks/useColors'
import { ErrorBoundary } from '@/src/components/error'
import { Button, Text } from '@/src/components/ui'
import { useNotificationStore, useThemeHydration } from '@/src/stores'
import { spacing } from '@/src/lib/theme'
import { embedInsets, isEmbedded, useEmbedThemeBridge } from '@/src/lib/embed'

SplashScreen.preventAutoHideAsync()

// The home tab is open to everyone; sign-in lives in the Profile tab and the
// (auth) screens are pushed on top of it (as a sheet on native).
export const unstable_settings = {
  initialRouteName: '(tabs)',
}

// In a desktop browser the app keeps a phone's proportions: one column, as
// wide as a large phone, centred, with a hairline down each side once the
// window is wider than that. On a phone-sized window (or inside the
// dashboard's phone frame) it fills the viewport like any app would.
const PHONE_COLUMN_WIDTH = 430

function PhoneColumn({ children }: PropsWithChildren) {
  const colors = useColors()
  const { width } = useWindowDimensions()

  if (Platform.OS !== 'web' || isEmbedded) {
    return <>{children}</>
  }

  const framed = width > PHONE_COLUMN_WIDTH
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.column,
          framed && { borderLeftColor: colors.border, borderRightColor: colors.border },
          framed && styles.columnFramed,
        ]}
      >
        {children}
      </View>
    </View>
  )
}

function InitializationError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  const colors = useColors()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
          backgroundColor: colors.background,
        },
        message: {
          marginVertical: spacing.md,
          textAlign: 'center',
        },
      }),
    [colors]
  )

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text variant="h2">Unable to start the app</Text>
      <Text variant="body" color="secondary" style={styles.message}>
        {message}
      </Text>
      <Button onPress={onRetry} variant="primary">
        Retry
      </Button>
    </View>
  )
}

function RootLayoutNav() {
  useEmbedThemeBridge()
  const session = useAuthStore((state) => state.session)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const initError = useAuthStore((state) => state.initError)
  const initialize = useAuthStore((state) => state.initialize)
  const setupAuthListener = useAuthStore((state) => state.setupAuthListener)
  const ensureToken = useNotificationStore((state) => state.ensureToken)
  const themeHydrated = useThemeHydration()

  // Set up auth listener on mount
  useEffect(() => {
    const unsubscribe = setupAuthListener()
    return unsubscribe
  }, [setupAuthListener])

  // Initialize auth session
  useEffect(() => {
    initialize()
  }, [initialize])

  // Refresh notification token when app returns to foreground
  useEffect(() => {
    if (!session?.user?.id) return

    const userId = session.user.id

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void ensureToken(userId)
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => subscription.remove()
  }, [ensureToken, session?.user?.id])

  const isReady = isInitialized && themeHydrated

  // Hold the splash screen until the session and persisted theme have loaded,
  // so the first frame is the right screen in the right theme.
  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync()
    }
  }, [isReady])

  if (initError) {
    return (
      <InitializationError
        message={initError.message}
        onRetry={() => {
          void initialize()
        }}
      />
    )
  }

  if (!isReady) {
    return null
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="(auth)"
        options={Platform.OS === 'web' ? undefined : { presentation: 'modal' }}
      />
    </Stack>
  )
}

export default function RootLayout() {
  const app = (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PhoneColumn>
          <RootLayoutNav />
        </PhoneColumn>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </ErrorBoundary>
  )

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Inside a phone-shaped iframe the page URL carries the device's
            insets (see src/lib/embed.ts); a real device reports its own. */}
        {embedInsets ? (
          <SafeAreaInsetsContext.Provider value={embedInsets}>{app}</SafeAreaInsetsContext.Provider>
        ) : (
          app
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: PHONE_COLUMN_WIDTH,
    alignSelf: 'center',
  },
  columnFramed: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
})
