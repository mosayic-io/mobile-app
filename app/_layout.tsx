import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo } from 'react'
import { AppState, type AppStateStatus, StyleSheet, View } from 'react-native'
import { QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { queryClient } from '@/src/lib/queryClient'
import { useAuthStore } from '@/src/features/auth'
import { useColors } from '@/src/hooks/useColors'
import { ErrorBoundary } from '@/src/components/error'
import { Button, Text } from '@/src/components/ui'
import { useNotificationStore, useThemeHydration } from '@/src/stores'
import { spacing } from '@/src/lib/theme'

SplashScreen.preventAutoHideAsync()

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
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <RootLayoutNav />
            <StatusBar style="auto" />
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})
