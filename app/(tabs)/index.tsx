import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from '@/src/components/ui'
import { useColors } from '@/src/hooks/useColors'
import { spacing, type Colors } from '@/src/lib/theme'
import { useAuthStore } from '@/src/features/auth'
import { ScreenErrorBoundary } from '@/src/components/error'

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    title: {
      marginBottom: spacing.sm,
    },
  })

function HomeScreen() {
  const user = useAuthStore((state) => state.user)
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View
      style={styles.container}
      accessibilityLabel="Home screen"
    >
      <Text variant="h2" style={styles.title}>
        Welcome!
      </Text>
      <Text variant="body" color="secondary">
        Logged in as {user?.email}
      </Text>
    </View>
  )
}

export default function Home() {
  return (
    <ScreenErrorBoundary screenName="Home">
      <HomeScreen />
    </ScreenErrorBoundary>
  )
}
