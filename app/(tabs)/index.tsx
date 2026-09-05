import { useEffect, useMemo } from 'react'
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { Avatar, Button, Card, Input, Text } from '@/src/components/ui'
import { useColors } from '@/src/hooks/useColors'
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding'
import { borderRadius, spacing, type Colors } from '@/src/lib/theme'
import { useAuthStore } from '@/src/features/auth'
import { useUserProfile } from '@/src/features/profile'
import { ScreenErrorBoundary } from '@/src/components/error'

// The home screen is where the design system begins. It is laid out like a
// real first screen — a greeting over a wash of the accent colour, then two
// glass cards that blur that colour behind them — and built only from the
// theme tokens (src/lib/theme.ts) and the UI primitives (src/components/ui),
// so a change to either shows up here first. Restyle it, or replace it with
// the app's real screens.
//
// Two slow loops, both a few pixels over several seconds, both off under
// reduced motion: the glow drifts behind the greeting, and a thin accent
// ring turns round the avatar.

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    // The glows sit behind the whole screen so the glass cards have colour
    // to blur, not just the greeting.
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      width: 340,
      height: 340,
      borderRadius: 170,
    },
    glowOne: {
      top: -150,
      right: -110,
    },
    glowTwo: {
      top: 60,
      left: -220,
      width: 380,
      height: 380,
      borderRadius: 190,
    },
    glowThree: {
      top: 420,
      right: -180,
      width: 300,
      height: 300,
      borderRadius: 150,
    },
    // Greeting band
    band: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    avatarWrap: {
      alignSelf: 'flex-start',
      padding: 3,
    },
    avatarRing: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: 'transparent',
      borderTopColor: colors.accent,
      borderRightColor: `${colors.accent}55`,
    },
    greeting: {
      gap: spacing.xs,
    },
    // Cards
    cards: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    cardText: {
      gap: spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    subscribeRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    subscribeInput: {
      flex: 1,
    },
  })

function Glow({
  clock,
  colors,
  style,
  drift,
}: {
  clock: SharedValue<number>
  colors: Colors
  style: StyleProp<ViewStyle>
  drift: { x: number; y: number }
}) {
  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(clock.value, [0, 1], [0, drift.x]) },
      { translateY: interpolate(clock.value, [0, 1], [0, drift.y]) },
      { scale: interpolate(clock.value, [0, 1], [1, 1.06]) },
    ],
  }))

  return (
    <Animated.View style={[style, animated]} pointerEvents="none">
      <LinearGradient
        colors={[`${colors.accent}4d`, `${colors.accent}14`, `${colors.accent}00`]}
        start={{ x: 0.5, y: 0.25 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  )
}

function HomeScreen() {
  const user = useAuthStore((state) => state.user)
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { data: profile } = useUserProfile(user?.id)
  const insets = useSafeAreaInsets()
  const tabBarPadding = useTabBarPadding()
  const animate = !useReducedMotion()

  // One slow 0 → 1 → 0 clock for the glows, and a steady turn for the ring.
  const clock = useSharedValue(0)
  const spin = useSharedValue(0)
  useEffect(() => {
    if (!animate) {
      clock.value = 0
      spin.value = 0
      return
    }
    clock.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    )
    spin.value = withRepeat(withTiming(360, { duration: 12_000, easing: Easing.linear }), -1, false)
  }, [animate, clock, spin])
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }))

  // Home is open to everyone — no user just means a neutral greeting
  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? null

  return (
    <View style={styles.container}>
      <View style={styles.backdrop} pointerEvents="none">
        <Glow clock={clock} colors={colors} style={[styles.glow, styles.glowOne]} drift={{ x: -30, y: 24 }} />
        <Glow clock={clock} colors={colors} style={[styles.glow, styles.glowTwo]} drift={{ x: 28, y: -18 }} />
        <Glow clock={clock} colors={colors} style={[styles.glow, styles.glowThree]} drift={{ x: -20, y: -30 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: tabBarPadding }}
        accessibilityLabel="Home screen"
      >
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.band, { paddingTop: insets.top + spacing.xl }]}
      >
        <View style={styles.avatarWrap}>
          <Animated.View style={[styles.avatarRing, ringStyle]} pointerEvents="none" />
          <Avatar source={profile?.photo_url} name={displayName ?? 'Guest'} size="md" />
        </View>
        <View style={styles.greeting}>
          <Text variant="h2">{displayName ? `Hi, ${displayName}` : 'Welcome'}</Text>
          <Text variant="bodySmall" color="secondary">
            {user?.email ?? 'Your app, ready to be shaped.'}
          </Text>
        </View>
      </Animated.View>

      {/* Sample content, one of each primitive, so an incoming design system
          has something real-looking to land on. Restyle or replace. */}
      <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.cards}>
        <Card>
          <View style={styles.cardText}>
            <Text variant="caption" color="accent" weight="semibold">
              Today
            </Text>
            <Text variant="h3">Your first screen</Text>
            <Text variant="bodySmall" color="secondary">
              Everything here is built from the app&apos;s own components. Change
              the theme, and this screen follows.
            </Text>
          </View>
          <View style={styles.actions}>
            <Button size="sm">Get started</Button>
            <Button size="sm" variant="ghost">
              Learn more
            </Button>
          </View>
        </Card>

        <Card>
          <View style={styles.cardText}>
            <Text variant="h3">Stay in the loop</Text>
            <Text variant="bodySmall" color="secondary">
              A note when there&apos;s something new. No noise.
            </Text>
          </View>
          <View style={styles.subscribeRow}>
            <Input
              placeholder="you@example.com"
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.subscribeInput}
            />
            <Button size="sm" variant="outline">
              Subscribe
            </Button>
          </View>
        </Card>
      </Animated.View>
      </ScrollView>
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
