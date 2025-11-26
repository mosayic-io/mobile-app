import { useRouter } from 'expo-router'
import { type ErrorInfo, type ReactNode, useCallback, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { useColors } from '@/src/hooks/useColors'
import { spacing, type Colors } from '@/src/lib/theme'
import { Button } from '@/src/components/ui/Button'
import { Text } from '@/src/components/ui/Text'
import { ErrorBoundary } from './ErrorBoundary'

type ScreenErrorBoundaryProps = {
  children: ReactNode
  screenName?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    icon: {
      marginBottom: spacing.lg,
    },
    title: {
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    message: {
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    buttons: {
      gap: spacing.sm,
      width: '100%',
      maxWidth: 300,
    },
  })

function ScreenErrorFallback({
  onRetry,
  screenName,
}: {
  onRetry: () => void
  screenName?: string
}) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const router = useRouter()

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/')
    }
  }, [router])

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons
        name="alert-circle-outline"
        size={64}
        color={colors.danger}
        style={styles.icon}
      />
      <Text variant="h2" style={styles.title}>
        Screen Error
      </Text>
      <Text variant="body" color="secondary" style={styles.message}>
        {screenName
          ? `The "${screenName}" screen encountered an error.`
          : 'This screen encountered an error.'}
        {'\n'}Please try again or go back.
      </Text>
      <View style={styles.buttons}>
        <Button onPress={onRetry} variant="primary" fullWidth>
          Try Again
        </Button>
        <Button onPress={handleGoBack} variant="outline" fullWidth>
          Go Back
        </Button>
      </View>
    </View>
  )
}

export function ScreenErrorBoundary({
  children,
  screenName,
  onError,
}: ScreenErrorBoundaryProps) {
  const handleError = useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      console.error(`Screen error in ${screenName || 'unknown'}:`, error)
      onError?.(error, errorInfo)
    },
    [screenName, onError]
  )

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={(reset) => (
        <ScreenErrorFallback onRetry={reset} screenName={screenName} />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
