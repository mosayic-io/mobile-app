import { useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Avatar, Button, Card, Input, Text } from '@/src/components/ui'
import { useColors } from '@/src/hooks/useColors'
import { spacing, type Colors } from '@/src/lib/theme'
import { useAuthStore } from '@/src/features/auth'
import { useUserProfile } from '@/src/features/profile'
import { ScreenErrorBoundary } from '@/src/components/error'

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    greetingText: {
      flex: 1,
      gap: spacing.xs,
    },
    previewHeader: {
      gap: spacing.xs,
    },
    previewButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statusRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
  })

function HomeScreen() {
  const user = useAuthStore((state) => state.user)
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { data: profile } = useUserProfile(user?.id)

  // Home is open to everyone — no user just means a neutral greeting
  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? null

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityLabel="Home screen"
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.greetingRow}>
        <Avatar source={profile?.photo_url} name={displayName ?? 'Guest'} size="md" />
        <View style={styles.greetingText}>
          <Text variant="h2">{displayName ? `Hi, ${displayName}` : 'Welcome'}</Text>
          {user?.email && (
            <Text variant="bodySmall" color="secondary">
              {user.email}
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Sample elements so an incoming design system has something to land
          on — one of each primitive. Restyle these (or delete the section)
          once the app has real screens. */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <Card>
          <View style={styles.previewHeader}>
            <Text variant="h3">Design preview</Text>
            <Text variant="caption">
              Sample elements showing off this app&apos;s design system. Restyle
              or delete them.
            </Text>
          </View>
          <Input label="Email" placeholder="you@example.com" leftIcon="mail-outline" />
          <View style={styles.previewButtons}>
            <Button size="sm">Get started</Button>
            <Button size="sm" variant="outline">
              Learn more
            </Button>
          </View>
          <View style={styles.statusRow}>
            <Text variant="caption" color="success">
              ● Success
            </Text>
            <Text variant="caption" color="accent">
              ● Accent
            </Text>
            <Text variant="caption" color="danger">
              ● Error
            </Text>
          </View>
        </Card>
      </Animated.View>
    </ScrollView>
  )
}

export default function Home() {
  return (
    <ScreenErrorBoundary screenName="Home">
      <HomeScreen />
    </ScreenErrorBoundary>
  )
}
