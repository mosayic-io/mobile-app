import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg'
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { Avatar, Card, ListGroup, ListRow, NavBar, Segmented, Text } from '@/src/components/ui'
import { useColors, useIsDark } from '@/src/hooks/useColors'
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding'
import {
  borderRadius,
  fontSize,
  spacing,
  type Colors,
  type ThemeMode,
} from '@/src/lib/theme'
import { useThemeStore } from '@/src/stores/themeStore'
import { useAuthStore } from '@/src/features/auth'
import { useUserProfile } from '@/src/features/profile'
import { ScreenErrorBoundary } from '@/src/components/error'

// The home screen is where the design system begins. It is laid out like a
// real first screen — a greeting, a picture, two tiles, then grouped lists —
// and built only from the theme tokens (src/lib/theme.ts) and the UI
// primitives (src/components/ui), so a change to either shows up here first.
//
// It also shows the theme to itself: the pill by the avatar switches
// light / dark / system, and the "Design system" section lays out the
// palette, the type scale and the shapes the rest of the app is drawn from.
// Every control on this screen does something real — nothing is a mock-up.
// Restyle it, or replace it with the app's real screens.
//
// Three slow loops, each a few pixels over many seconds, all off under
// reduced motion: the accent glow breathes behind the greeting, the picture
// drifts the way a photo does on a lock screen, and the dot on the theme
// pill pulses.

// The cover picture is fetched, not bundled — nothing to delete when you
// replace it with your own. (Unsplash; free to use.)
const HERO = {
  uri: 'https://images.unsplash.com/photo-1594730900439-6a1bb8504ea4?fm=jpg&q=70&w=1200&auto=format&fit=crop',
}

const FACETS = [
  { value: 'colour', label: 'Colour' },
  { value: 'type', label: 'Type' },
  { value: 'shape', label: 'Shape' },
] as const

type Facet = (typeof FACETS)[number]['value']

// The pill by the avatar walks through the three theme modes in turn.
const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

const MODE_LABEL: Record<ThemeMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}

// The page gutter: the iOS content margin.
const GUTTER = spacing.md + spacing.xs
const HERO_HEIGHT = 190
const GLOW_SIZE = 420
const SWATCH = 26

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    // The glow sits behind the whole screen, top right, and never takes a tap.
    glow: {
      position: 'absolute',
      width: GLOW_SIZE,
      height: GLOW_SIZE,
      top: -GLOW_SIZE * 0.55,
      right: -GLOW_SIZE * 0.3,
    },
    content: {
      paddingHorizontal: GUTTER,
      gap: spacing.lg,
    },
    // Top row
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      height: 36,
      paddingHorizontal: spacing.md - 2,
      borderRadius: borderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge,
      backgroundColor: colors.glassTab,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    pillDot: {
      width: 7,
      height: 7,
      borderRadius: borderRadius.full,
      backgroundColor: colors.accent,
    },
    // Greeting
    greeting: {
      gap: spacing.xs + 2,
    },
    eyebrow: {
      letterSpacing: 1.3,
      textTransform: 'uppercase',
    },
    // Picture
    hero: {
      height: HERO_HEIGHT,
      marginHorizontal: -GUTTER,
      overflow: 'hidden',
      backgroundColor: colors.accentSoft,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    // Tiles
    tiles: {
      flexDirection: 'row',
      gap: spacing.sm + 4,
    },
    tile: {
      flex: 1,
    },
    tileText: {
      gap: 1,
    },
    // Sections
    section: {
      gap: spacing.sm + 2,
      marginTop: spacing.sm,
    },
    sectionHeader: {
      paddingHorizontal: spacing.md + 2,
      textTransform: 'uppercase',
    },
    // Colour panel
    swatch: {
      width: SWATCH,
      height: SWATCH,
      borderRadius: borderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge,
    },
    swatchSurface: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    // Type panel
    typeSurface: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge,
      overflow: 'hidden',
    },
    specimen: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.md,
      padding: spacing.md,
    },
    specimenDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    // Shape panel
    shapes: {
      gap: spacing.sm + 4,
    },
    shapeRow: {
      flexDirection: 'row',
      gap: spacing.sm + 4,
    },
    shapeItem: {
      flex: 1,
      gap: spacing.xs + 3,
    },
    shapeBox: {
      height: 64,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    elevationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  })

// A soft radial wash of the accent, breathing: it swells a little and drifts
// a few pixels over nine seconds, then back.
function Glow({
  clock,
  colors,
  style,
}: {
  clock: SharedValue<number>
  colors: Colors
  style: StyleProp<ViewStyle>
}) {
  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(clock.get(), [0, 1], [0, -18]) },
      { translateY: interpolate(clock.get(), [0, 1], [0, 14]) },
      { scale: interpolate(clock.get(), [0, 1], [1, 1.12]) },
    ],
  }))

  return (
    <Animated.View style={[style, animated]} pointerEvents="none">
      <Svg width={GLOW_SIZE} height={GLOW_SIZE} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.14} />
            <Stop offset="70%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#glow)" />
      </Svg>
    </Animated.View>
  )
}

// The picture, drifting: a slow push in and a few pixels of travel over
// sixteen seconds, then back out — the lock-screen photo effect.
function Hero({ clock, styles }: { clock: SharedValue<number>; styles: ReturnType<typeof createStyles> }) {
  const animated = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(clock.get(), [0, 1], [1, 1.08]) },
      { translateX: interpolate(clock.get(), [0, 1], [0, -8]) },
    ],
  }))

  return (
    <View style={styles.hero} accessibilityRole="image" accessibilityLabel="Cover picture">
      <Animated.View style={[styles.heroImage, animated]}>
        <Image source={HERO} style={styles.heroImage} contentFit="cover" transition={300} />
      </Animated.View>
    </View>
  )
}

// The theme pill: a glass chip with a pulsing accent dot. A working
// control, not a badge — it switches the whole app's theme.
function ThemePill({
  mode,
  onPress,
  animate,
  styles,
}: {
  mode: ThemeMode
  onPress: () => void
  animate: boolean
  styles: ReturnType<typeof createStyles>
}) {
  const scale = useSharedValue(1)
  const pulse = useSharedValue(0)

  useEffect(() => {
    pulse.set(
      animate
        ? withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true)
        : 0
    )
  }, [animate, pulse])

  const pressed = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }))
  const dot = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.get(), [0, 1], [1, 0.45]),
    transform: [{ scale: interpolate(pulse.get(), [0, 1], [1, 0.8]) }],
  }))

  return (
    <Animated.View style={pressed}>
      <Pressable
        style={styles.pill}
        onPress={onPress}
        onPressIn={() => scale.set(withSpring(0.94, { damping: 14, stiffness: 260, mass: 0.6 }))}
        onPressOut={() => scale.set(withSpring(1, { damping: 14, stiffness: 260, mass: 0.6 }))}
        accessibilityRole="button"
        accessibilityLabel={`Appearance: ${MODE_LABEL[mode]}`}
        accessibilityHint={`Double tap to switch to ${MODE_LABEL[NEXT_MODE[mode]].toLowerCase()}`}
      >
        <Animated.View style={[styles.pillDot, dot]} />
        <Text variant="label" weight="semibold">
          {MODE_LABEL[mode]}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

function ColourPanel({ colors, styles }: { colors: Colors; styles: ReturnType<typeof createStyles> }) {
  const tokens = [
    { name: 'accent', value: colors.accent },
    { name: 'success', value: colors.success },
    { name: 'warning', value: colors.warning },
    { name: 'danger', value: colors.danger },
    { name: 'text', value: colors.text },
    { name: 'surface', value: colors.surface },
  ]

  return (
    <ListGroup>
      {tokens.map((token) => (
        <ListRow
          key={token.name}
          title={token.name}
          leading={
            <View
              style={[
                styles.swatch,
                { backgroundColor: token.value },
                token.name === 'surface' && styles.swatchSurface,
              ]}
            />
          }
          detail={<Text variant="mono">{token.value.toUpperCase()}</Text>}
        />
      ))}
    </ListGroup>
  )
}

const TYPE_SPECIMENS = [
  { variant: 'h1', name: '3xl', size: fontSize['3xl'], weight: 'bold' },
  { variant: 'h3', name: 'xl', size: fontSize.xl, weight: 'semibold' },
  { variant: 'body', name: 'base', size: fontSize.base, weight: 'normal' },
  { variant: 'caption', name: 'xs', size: fontSize.xs, weight: 'normal' },
] as const

function TypePanel({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.typeSurface}>
      {TYPE_SPECIMENS.map((specimen, index) => (
        <View key={specimen.name}>
          {index > 0 && <View style={styles.specimenDivider} />}
          <View style={styles.specimen}>
            <Text variant={specimen.variant} numberOfLines={1}>
              {specimen.name}
            </Text>
            <Text variant="mono">
              {specimen.size} / {specimen.weight}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

const SHAPES = [
  { name: 'card', value: borderRadius.card },
  { name: 'control', value: borderRadius.control },
  { name: 'full', value: borderRadius.full },
] as const

function ShapePanel({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.shapes}>
      <View style={styles.shapeRow}>
        {SHAPES.map((shape) => (
          <View key={shape.name} style={styles.shapeItem}>
            <View style={[styles.shapeBox, { borderRadius: shape.value }]} />
            <Text variant="label">{shape.name}</Text>
            <Text variant="mono">{shape.value}px</Text>
          </View>
        ))}
      </View>
      <Card>
        <View style={styles.elevationRow}>
          <Text variant="label">Elevation</Text>
          <Text variant="mono">soft / 30</Text>
        </View>
      </Card>
    </View>
  )
}

function HomeScreen() {
  const user = useAuthStore((state) => state.user)
  const colors = useColors()
  const isDark = useIsDark()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { data: profile } = useUserProfile(user?.id)
  const insets = useSafeAreaInsets()
  const tabBarPadding = useTabBarPadding()
  const animate = !useReducedMotion()
  const router = useRouter()
  const { mode, setMode } = useThemeStore()
  const [facet, setFacet] = useState<Facet>('colour')

  // The scroll position drives the glass NavBar.
  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
  })

  // Two slow 0 → 1 → 0 clocks: one for the glow, a slower one for the picture.
  const glowClock = useSharedValue(0)
  const heroClock = useSharedValue(0)
  useEffect(() => {
    if (!animate) {
      glowClock.set(0)
      heroClock.set(0)
      return
    }
    glowClock.set(
      withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true)
    )
    heroClock.set(
      withRepeat(withTiming(1, { duration: 16_000, easing: Easing.inOut(Easing.sin) }), -1, true)
    )
  }, [animate, glowClock, heroClock])

  // Home is open to everyone — no user just means a neutral greeting.
  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? null
  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
    []
  )
  const cycleTheme = () => setMode(NEXT_MODE[mode])
  const goProfile = () => router.push('/(tabs)/profile')

  return (
    <View style={styles.container}>
      <Glow clock={glowClock} colors={colors} style={styles.glow} />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: tabBarPadding },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Home screen"
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.topRow}>
          <Pressable
            onPress={goProfile}
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            hitSlop={spacing.sm}
          >
            <Avatar source={profile?.photo_url} name={displayName} size="md" />
          </Pressable>
          <ThemePill mode={mode} onPress={cycleTheme} animate={animate} styles={styles} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.greeting}>
          <Text variant="caption" color="secondary" weight="semibold" style={styles.eyebrow}>
            {today}
          </Text>
          <Text variant="h1">{displayName ? `Hi, ${displayName}` : 'Hi there'}</Text>
          <Text variant="body" color="secondary">
            Your app, ready to be shaped.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Hero clock={heroClock} styles={styles} />
        </Animated.View>

        {/* Two tiles — the shape a real app's shortcuts take. Both work. */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.tiles}>
          <Card style={styles.tile} onPress={goProfile} accessibilityLabel="Profile" accessibilityHint="Opens your profile">
            <Ionicons name="person-outline" size={24} color={colors.text} />
            <View style={styles.tileText}>
              <Text variant="label" weight="semibold">
                Profile
              </Text>
              <Text variant="caption" color="secondary">
                Make it yours
              </Text>
            </View>
          </Card>
          <Card
            style={styles.tile}
            onPress={cycleTheme}
            accessibilityLabel={`Appearance: ${MODE_LABEL[mode]}`}
            accessibilityHint={`Double tap to switch to ${MODE_LABEL[NEXT_MODE[mode]].toLowerCase()}`}
          >
            <Ionicons name="contrast-outline" size={24} color={colors.text} />
            <View style={styles.tileText}>
              <Text variant="label" weight="semibold">
                Appearance
              </Text>
              <Text variant="caption" color="secondary">
                {MODE_LABEL[mode]}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* The design system, showing itself: palette, type scale, shapes. */}
        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.section}>
          <Text variant="caption" color="secondary" style={styles.sectionHeader}>
            Design system · {isDark ? 'dark' : 'light'}
          </Text>
          <Segmented
            options={FACETS}
            value={facet}
            onChange={setFacet}
            accessibilityLabel="Design system tokens"
          />
          <Animated.View key={facet} entering={animate ? FadeIn.duration(220) : undefined}>
            {facet === 'colour' && <ColourPanel colors={colors} styles={styles} />}
            {facet === 'type' && <TypePanel styles={styles} />}
            {facet === 'shape' && <ShapePanel styles={styles} />}
          </Animated.View>
        </Animated.View>

        {/* Where the pieces live. */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <ListGroup header="Under the hood">
            <ListRow title="Theme tokens" detail={<Text variant="mono">theme.ts</Text>} />
            <ListRow title="Navigation" detail={<Text variant="mono">expo-router</Text>} />
            <ListRow title="Theme memory" detail={<Text variant="mono">zustand</Text>} />
          </ListGroup>
        </Animated.View>
      </Animated.ScrollView>

      <NavBar title="Home" scrollY={scrollY} />
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
