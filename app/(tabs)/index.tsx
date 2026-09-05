import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
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
import { borderRadius, spacing, type Colors } from '@/src/lib/theme'
import { useAuthStore } from '@/src/features/auth'
import { useUserProfile } from '@/src/features/profile'
import { ScreenErrorBoundary } from '@/src/components/error'

// The home screen is where the design system begins. Everything below is
// built from the theme tokens (src/lib/theme.ts) and the UI primitives
// (src/components/ui), so a change to either shows up here first: the
// palette tiles, the type scale and the component specimens are the app's
// own tokens, not a mock-up. Restyle it, or replace it with real screens.
//
// The slow loops (the drifting glow, the palette ripple, the avatar ring,
// the placeholder that types itself) are deliberately small — a few pixels,
// several seconds — and all stop when the device asks for reduced motion.

const PALETTE: { token: keyof Colors; label: string }[] = [
  { token: 'primary', label: 'primary' },
  { token: 'accent', label: 'accent' },
  { token: 'success', label: 'success' },
  { token: 'warning', label: 'warning' },
  { token: 'danger', label: 'danger' },
]

const SAMPLE_EMAIL = 'you@example.com'

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
    // Hero
    hero: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      paddingVertical: spacing.xl,
      overflow: 'hidden',
      gap: spacing.md,
    },
    glow: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
    },
    glowOne: {
      top: -120,
      right: -80,
    },
    glowTwo: {
      bottom: -160,
      left: -60,
      width: 300,
      height: 300,
      borderRadius: 150,
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
    heroText: {
      gap: spacing.xs,
    },
    // Design preview
    sectionLabel: {
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: colors.tertiary,
    },
    section: {
      gap: spacing.sm,
    },
    paletteRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    swatch: {
      flex: 1,
      gap: spacing.xs,
      alignItems: 'center',
    },
    swatchTile: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeScale: {
      gap: spacing.xs,
    },
    typeLine: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    buttonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
  })

// A slow, bounded 0 → 1 → 0 clock every screen loop hangs off. One clock,
// many readers: the tiles, the glow and the ring stay in step for free.
function useLoopClock(durationMs: number, enabled: boolean) {
  const clock = useSharedValue(0)

  useEffect(() => {
    if (!enabled) {
      clock.value = 0
      return
    }
    clock.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    )
  }, [clock, durationMs, enabled])

  return clock
}

// The email placeholder types itself, rests, clears, and goes again.
function useTypingPlaceholder(full: string, enabled: boolean) {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!enabled) return
    let index = 0
    let timer: ReturnType<typeof setTimeout>
    const step = () => {
      index += 1
      setTyped(full.slice(0, index))
      if (index < full.length) {
        timer = setTimeout(step, 70)
      } else {
        // Hold the finished address, then start over.
        timer = setTimeout(() => {
          index = 0
          setTyped('')
          timer = setTimeout(step, 700)
        }, 2600)
      }
    }
    timer = setTimeout(step, 900)
    return () => clearTimeout(timer)
  }, [enabled, full])

  return enabled ? typed : full
}

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
      { scale: interpolate(clock.value, [0, 1], [1, 1.08]) },
    ],
  }))

  return (
    <Animated.View style={[style, animated]} pointerEvents="none">
      <LinearGradient
        colors={[`${colors.accent}59`, `${colors.accent}1a`, `${colors.accent}00`]}
        start={{ x: 0.5, y: 0.2 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  )
}

function Swatch({
  clock,
  index,
  color,
  label,
  styles,
}: {
  clock: SharedValue<number>
  index: number
  color: string
  label: string
  styles: ReturnType<typeof createStyles>
}) {
  // Each tile lifts a touch later than the one before it — a ripple that
  // runs left to right once per clock cycle.
  const start = 0.1 + index * 0.08
  const animated = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(clock.value, [start, start + 0.12, start + 0.24], [1, 1.06, 1], 'clamp') },
      { translateY: interpolate(clock.value, [start, start + 0.12, start + 0.24], [0, -3, 0], 'clamp') },
    ],
  }))

  return (
    <View style={styles.swatch}>
      <Animated.View style={[styles.swatchTile, { backgroundColor: color }, animated]} />
      <Text variant="caption">{label}</Text>
    </View>
  )
}

function HomeScreen() {
  const user = useAuthStore((state) => state.user)
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { data: profile } = useUserProfile(user?.id)
  const reduceMotion = useReducedMotion()
  const animate = !reduceMotion

  const clock = useLoopClock(7000, animate)
  const spin = useSharedValue(0)
  useEffect(() => {
    if (!animate) {
      spin.value = 0
      return
    }
    spin.value = withRepeat(withTiming(360, { duration: 10_000, easing: Easing.linear }), -1, false)
  }, [animate, spin])
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }))
  const placeholder = useTypingPlaceholder(SAMPLE_EMAIL, animate)

  // Home is open to everyone — no user just means a neutral greeting
  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? null

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityLabel="Home screen"
    >
      {/* Hero — the greeting, on a slow-moving wash of the accent colour */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
        <Glow clock={clock} colors={colors} style={[styles.glow, styles.glowOne]} drift={{ x: -24, y: 18 }} />
        <Glow clock={clock} colors={colors} style={[styles.glow, styles.glowTwo]} drift={{ x: 20, y: -14 }} />

        <View style={styles.avatarWrap}>
          <Animated.View style={[styles.avatarRing, ringStyle]} pointerEvents="none" />
          <Avatar source={profile?.photo_url} name={displayName ?? 'Guest'} size="md" />
        </View>
        <View style={styles.heroText}>
          <Text variant="h1">{displayName ? `Hi, ${displayName}` : 'Welcome'}</Text>
          <Text variant="body" color="secondary">
            {user?.email ?? 'Your app, ready to be shaped.'}
          </Text>
        </View>
      </Animated.View>

      {/* Design preview — the app's own tokens and primitives, as specimens.
          One of each, so an incoming design system has something to land on. */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <Card>
          <Text variant="h3">Design preview</Text>

          <View style={styles.section}>
            <Text variant="caption" style={styles.sectionLabel}>
              Palette
            </Text>
            <View style={styles.paletteRow}>
              {PALETTE.map((entry, index) => (
                <Swatch
                  key={entry.token}
                  clock={clock}
                  index={index}
                  color={colors[entry.token]}
                  label={entry.label}
                  styles={styles}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="caption" style={styles.sectionLabel}>
              Type
            </Text>
            <View style={styles.typeScale}>
              <View style={styles.typeLine}>
                <Text variant="h2">Heading</Text>
                <Text variant="caption">h2</Text>
              </View>
              <View style={styles.typeLine}>
                <Text variant="body">Body text for reading.</Text>
                <Text variant="caption">body</Text>
              </View>
              <View style={styles.typeLine}>
                <Text variant="caption">A caption, for the small print.</Text>
                <Text variant="caption">caption</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="caption" style={styles.sectionLabel}>
              Components
            </Text>
            <Input placeholder={placeholder} leftIcon="mail-outline" />
            <View style={styles.buttonRow}>
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="outline">
                Outline
              </Button>
              <Button size="sm" variant="ghost">
                Ghost
              </Button>
            </View>
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
