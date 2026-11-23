import Constants from 'expo-constants'
import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'

import {
  Avatar,
  Card,
  LEADING_SIZE,
  ListGroup,
  ListRow,
  NavBar,
  Segmented,
  Text,
} from '@/src/components/ui'
import { useColors } from '@/src/hooks/useColors'
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding'
import { borderRadius, spacing, type Colors, type ThemeMode } from '@/src/lib/theme'
import { useAuthStore } from '@/src/features/auth'
import { useProfile } from '@/src/features/profile'
import { backendConfigured } from '@/src/lib/env'
import { errorMessage, notify } from '@/src/lib/feedback'
import { useThemeStore } from '@/src/stores/themeStore'
import { ScreenErrorBoundary } from '@/src/components/error'

// Profile is a settings screen in the iOS Settings mould: a large title, the
// person on a card (or a sign-in card when signed out), then grouped rows
// with coloured icon chips — the same palette and sheen as the home mosaic.
// Appearance is a segmented control, so all three choices are visible.

const THEME_OPTIONS = [
  { value: 'system', label: 'Automatic' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ThemeMode; label: string }[]

const GUTTER = spacing.md + spacing.xs
// The large title's height: the glass bar's title fades in once it's gone.
const TITLE_SCROLL_THRESHOLD = 52

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
    largeTitle: {
      paddingHorizontal: spacing.xs,
    },
    person: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    personText: {
      flex: 1,
      gap: 2,
    },
    chip: {
      width: LEADING_SIZE,
      height: LEADING_SIZE,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '60%',
    },
    segmentWrap: {
      padding: spacing.sm + 2,
    },
  })

type Styles = ReturnType<typeof createStyles>
type Hue = 0 | 1 | 2 | 3

// The rounded colour square before a row's title, as in iOS Settings.
function IconChip({
  icon,
  hue,
  colors,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap
  hue: Hue
  colors: Colors
  styles: Styles
}) {
  return (
    <View style={[styles.chip, { backgroundColor: colors.mosaic[hue] }]}>
      <LinearGradient colors={colors.mosaicSheen} style={styles.sheen} />
      <Ionicons name={icon} size={17} color={colors.onMosaic} />
    </View>
  )
}

function ProfileScreen() {
  const { user, signOut } = useAuthStore()
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const { mode, setMode } = useThemeStore()
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const tabBarPadding = useTabBarPadding()
  const { profile, displayName } = useProfile(user)

  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y)
  })

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      notify('Sign Out Failed', errorMessage(error))
    } finally {
      setSigningOut(false)
    }
  }, [signOut])

  const editProfile = () => router.push('/(tabs)/edit-profile')
  const version = Constants.expoConfig?.version ?? '0.0.1'

  // The card at the top: the person when signed in; otherwise the way in —
  // or, with no backend yet, what to do about that.
  const personCard = user
    ? {
        title: displayName ?? 'Your account',
        subtitle: user.email ?? '',
        onPress: editProfile,
        hint: 'Opens your account details',
      }
    : backendConfigured
      ? {
          title: 'Sign in',
          subtitle: 'Keep your account and use it on any phone.',
          onPress: () => router.push('/(auth)/sign-in'),
          hint: 'Opens the sign-in options',
        }
      : {
          title: 'Sign in',
          subtitle: 'Ask Claude Code to connect Supabase first.',
          onPress: undefined,
          hint: undefined,
        }

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
        <Text variant="h1" style={styles.largeTitle}>
          Profile
        </Text>

        <Card
          onPress={personCard.onPress}
          accessibilityLabel={`${personCard.title}. ${personCard.subtitle}`}
          accessibilityHint={personCard.hint}
        >
          <View style={styles.person}>
            <Avatar source={user ? profile?.photo_url : null} name={user ? displayName : null} size="lg" />
            <View style={styles.personText}>
              <Text variant="h3" numberOfLines={1}>
                {personCard.title}
              </Text>
              {personCard.subtitle ? (
                <Text variant="bodySmall" color="secondary">
                  {personCard.subtitle}
                </Text>
              ) : null}
            </View>
            {personCard.onPress ? (
              <Ionicons name="chevron-forward" size={18} color={colors.tertiary} />
            ) : null}
          </View>
        </Card>

        {user ? (
          <ListGroup header="Account">
            <ListRow
              title="Name"
              leading={<IconChip icon="person" hue={0} colors={colors} styles={styles} />}
              detail={profile?.display_name ?? 'Not set'}
              onPress={editProfile}
              accessibilityHint="Change your name"
            />
            <ListRow
              title="Password & account"
              leading={<IconChip icon="lock-closed" hue={2} colors={colors} styles={styles} />}
              onPress={editProfile}
              accessibilityHint="Change your password or delete your account"
            />
          </ListGroup>
        ) : null}

        <ListGroup header="Appearance">
          <View style={styles.segmentWrap}>
            <Segmented
              options={THEME_OPTIONS}
              value={mode}
              onChange={setMode}
              accessibilityLabel="Appearance"
            />
          </View>
        </ListGroup>

        <ListGroup header="About">
          <ListRow
            title="Version"
            leading={<IconChip icon="information" hue={3} colors={colors} styles={styles} />}
            detail={version}
          />
        </ListGroup>

        {user ? (
          <ListGroup>
            <ListRow
              title={signingOut ? 'Signing out…' : 'Sign out'}
              tone="danger"
              chevron={false}
              onPress={handleSignOut}
              disabled={signingOut}
              accessibilityLabel="Sign out of your account"
            />
          </ListGroup>
        ) : null}
      </Animated.ScrollView>

      <NavBar title="Profile" scrollY={scrollY} threshold={TITLE_SCROLL_THRESHOLD} />
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
