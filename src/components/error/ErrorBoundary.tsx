import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Appearance, StyleSheet, View } from 'react-native'

import { Button } from '@/src/components/ui/Button'
import { Text } from '@/src/components/ui/Text'
import { getColors, spacing, type Colors } from '@/src/lib/theme'
import { useThemeStore } from '@/src/stores/themeStore'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode | ((reset: () => void) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  private getColors(): Colors {
    const mode = useThemeStore.getState().mode
    const systemScheme = Appearance.getColorScheme()
    const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark')
    return getColors(isDark)
  }

  private getStyles(colors: Colors) {
    return StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.background,
      },
      title: {
        marginBottom: spacing.sm,
        textAlign: 'center',
        color: colors.text,
      },
      message: {
        marginBottom: spacing.lg,
        textAlign: 'center',
        color: colors.secondary,
      },
      errorDetails: {
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 8,
        maxWidth: '100%',
      },
      errorText: {
        fontFamily: 'monospace',
        color: colors.text,
      },
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.handleReset)
          : this.props.fallback
      }

      const colors = this.getColors()
      const styles = this.getStyles(colors)

      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text variant="h2" style={styles.title}>
            Something went wrong
          </Text>
          <Text variant="body" color="secondary" style={styles.message}>
            We&apos;re sorry, but something unexpected happened. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <Text variant="caption" style={styles.errorText}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <Button onPress={this.handleReset} variant="primary">
            Try Again
          </Button>
        </View>
      )
    }

    return this.props.children
  }
}
