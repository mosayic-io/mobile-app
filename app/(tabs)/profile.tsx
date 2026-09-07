import Constants from 'expo-constants'
import { useCallback, useMemo, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'

import { Avatar, ListGroup, ListRow, NavBar, Text } from '@/src/components/ui'
import { useColors } from '@/src/hooks/useColors'
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding'
import { spacing, borderRadius, type Colors, type ThemeMode } from '@/src/lib/theme'
import { useAuthStore } from '@/src/features/auth'
import { useUserProfile } from '@/src/features/profile'
import { backendConfigured } from '@/src/lib/env'
import { useThemeStore } from '@/src/stores/themeStore'
import { ScreenErrorBoundary } from '@/src/components/error'

// Profile is a settings screen: a large title, the person, then grouped
// lists. Signed out it still stands — the rows read "Not set" and the one
// action is Sign in. The theme row cycles system → light → dark on tap.

const MODE_LABEL: Record<ThemeMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

const GUTTER = spacing.md + spacing.xs

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: GUTTER,
      gap: spacing.lg,
    },
    person: {
      alignItems: 'center',
      gap: spacing.sm + 2,
      paddingTop: spacing.sm,
    },
    personText: {
      alignItems: 'center',
      gap: 2,
    },
    centred: {
      textAlign: 'center',
    },
    swatch: {
      width: 22,
      height: 22,
      borderRadius: borderRadius.full,
      backgroundColor: colors.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge,
    },
  })

function ProfileScreen() {
  const { user, signOut, isLoading } = useAuthStore()
  const router = useRouter()
  const { mode, setMode } = useThemeStore()
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const tabBarPadding = useTabBarPadding()
  const { data: profile } = useUserProfile(user?.id)
  const [signInNotice, setSignInNotice] = useState<string | null>(null)

  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
  })

  const handleSignIn = useCallback(() => {
    if (!backendConfigured) {
      setSignInNotice("Connect Supabase first — this app doesn't have a backend yet.")
      return
    }
    router.push('/(auth)/sign-in')
  }, [router])

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      Alert.alert(
        'Sign Out Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }, [signOut])

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? null
  const version = Constants.expoConfig?.version ?? '0.0.1'

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: tabBarPadding },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Profile screen"
      >
        <Text variant="h1" accessibilityRole="header">
          Profile
        </Text>

        <View style={styles.person}>
          <Avatar source={profile?.photo_url} name={displayName} size="xl" />
          <View style={styles.personText}>
            <Text variant="h3" weight="bold" style={styles.centred}>
              {displayName ?? 'Your name here'}
            </Text>
            <Text variant="bodySmall" color="secondary" style={styles.centred}>
              {user?.email ??
                (backendConfigured
                  ? 'Sign in to see your account here.'
                  : 'This screen fills in when your product does.')}
            </Text>
          </View>
        </View>

        {user ? (
          <ListGroup header="Account">
            <ListRow
              title="Name"
              detail={profile?.display_name ?? 'Not set'}
              onPress={() => router.push('/(tabs)/edit-profile')}
              accessibilityHint="Opens your account details"
            />
            <ListRow title="Email" detail={user.email ?? 'Not set'} />
            <ListRow
              title="Password & account"
              onPress={() => router.push('/(tabs)/edit-profile')}
              accessibilityHint="Change your password or delete your account"
            />
          </ListGroup>
        ) : (
          <ListGroup header="Account" footer={signInNotice ?? undefined}>
            <ListRow title="Name" detail="Not set" />
            <ListRow title="Email" detail="Not set" />
            <ListRow
              title="Sign in"
              tone="accent"
              onPress={handleSignIn}
              accessibilityHint="Opens the sign-in options"
            />
          </ListGroup>
        )}

        <ListGroup header="Appearance">
          <ListRow
            title="Theme"
            detail={MODE_LABEL[mode]}
            onPress={() => setMode(NEXT_MODE[mode])}
            accessibilityLabel={`Theme: ${MODE_LABEL[mode]}`}
            accessibilityHint={`Double tap to switch to ${MODE_LABEL[NEXT_MODE[mode]].toLowerCase()}`}
          />
          <ListRow
            title="Accent"
            detail={
              <>
                <View style={styles.swatch} />
                <Text variant="mono">{colors.accent.toUpperCase()}</Text>
              </>
            }
          />
        </ListGroup>

        <ListGroup header="About">
          <ListRow title="Version" detail={version} />
          <ListRow title="Design system" detail={<Text variant="mono">theme.ts</Text>} />
        </ListGroup>

        {user && (
          <ListGroup>
            <ListRow
              title={isLoading ? 'Signing out…' : 'Sign out'}
              tone="danger"
              chevron={false}
              onPress={handleSignOut}
              disabled={isLoading}
              accessibilityLabel="Sign out of your account"
            />
          </ListGroup>
        )}
      </Animated.ScrollView>

      <NavBar title="Profile" scrollY={scrollY} />
    </View>
  )
}

export default function Profile() {
  return (
    <ScreenErrorBoundary screenName="Profile">
      <ProfileScreen />
    </ScreenErrorBoundary>
  )
}
