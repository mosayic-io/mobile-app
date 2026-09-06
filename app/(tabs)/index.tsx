import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { Avatar, Button, Card, Text } from '@/src/components/ui'
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
import { backendConfigured } from '@/src/lib/env'
import { ScreenErrorBoundary } from '@/src/components/error'

// The home screen is where the design system begins. It is laid out like a
// real first screen — a greeting over a wash of the accent colour, then glass
// cards that blur that colour behind them — and built only from the theme
// tokens (src/lib/theme.ts) and the UI primitives (src/components/ui), so a
// change to either shows up here first.
//
// It also shows the theme to itself: the pill by the avatar switches
// light / dark / system, and the "Design system" card lays out the palette,
// the type scale and the shapes the rest of the app is drawn from. Every
// control on this screen does something real — nothing here is a mock-up.
// Restyle it, or replace it with the app's real screens.
//
// Two slow loops, both a few pixels over several seconds, both off under
// reduced motion: the glow drifts behind the greeting, and a thin accent
// ring turns round the avatar.

const FACETS = [
  { key: 'colour', label: 'Colour' },
  { key: 'type', label: 'Type' },
  { key: 'shape', label: 'Shape' },
] as const

type Facet = (typeof FACETS)[number]['key']

// The pill by the avatar walks through the three theme modes in turn.
const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

const MODE_META: Record<ThemeMode, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  system: { label: 'System', icon: 'phone-portrait-outline' },
  light: { label: 'Light', icon: 'sunny-outline' },
  dark: { label: 'Dark', icon: 'moon-outline' },
}

const TYPE_SPECIMENS = [
  { variant: 'h1', sample: 'Display', size: fontSize['3xl'] },
  { variant: 'h3', sample: 'Subhead', size: fontSize.xl },
  { variant: 'body', sample: 'Body text', size: fontSize.base },
  { variant: 'caption', sample: 'Caption', size: fontSize.xs },
] as const

const RADII = [
  { name: 'sm', value: borderRadius.sm },
  { name: 'md', value: borderRadius.md },
  { name: 'lg', value: borderRadius.lg },
  { name: 'full', value: borderRadius.full },
] as const

const SPACES = [
  { name: 'xs', value: spacing.xs },
  { name: 'sm', value: spacing.sm },
  { name: 'md', value: spacing.md },
  { name: 'lg', value: spacing.lg },
  { name: 'xl', value: spacing.xl },
] as const

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
    // borderRadius alone doesn't clip a child — without overflow the
    // gradient shows as a hard-edged rectangle instead of a soft orb.
    glow: {
      position: 'absolute',
      width: 340,
      height: 340,
      borderRadius: 170,
      overflow: 'hidden',
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
    bandTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    avatarWrap: {
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
    eyebrow: {
      letterSpacing: 1.2,
    },
    // Theme pill
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.glassEdge,
      backgroundColor: colors.glassFill,
    },
    chipPressed: {
      opacity: 0.7,
    },
    // Cards
    sections: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    cardText: {
      gap: spacing.xs,
    },
    eyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    rule: {
      height: 2,
      borderRadius: 1,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    // Design system card
    segments: {
      flexDirection: 'row',
      padding: 3,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
    },
    segmentPill: {
      position: 'absolute',
      top: 3,
      bottom: 3,
      left: 3,
      borderRadius: borderRadius.full,
      backgroundColor: `${colors.accent}24`,
      borderWidth: 1,
      borderColor: `${colors.accent}59`,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    panel: {
      minHeight: 184,
      justifyContent: 'center',
    },
    swatches: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    swatchItem: {
      width: 76,
      gap: spacing.xs,
    },
    swatch: {
      height: 56,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.glassEdge,
    },
    specimen: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },
    shapeGroup: {
      gap: spacing.sm,
    },
    shapeRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.md,
    },
    radius: {
      width: 48,
      height: 48,
      backgroundColor: `${colors.accent}1f`,
      borderWidth: 1,
      borderColor: `${colors.accent}55`,
    },
    spaceItem: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    spaceBar: {
      height: 28,
      borderRadius: 2,
      backgroundColor: colors.accent,
    },
    // Link rows
    rows: {
      marginHorizontal: -spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.xs,
    },
    rowPressed: {
      opacity: 0.6,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.accent}1f`,
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 38 + spacing.md + spacing.xs,
    },
    footer: {
      alignItems: 'center',
      paddingTop: spacing.sm,
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

// Colour / Type / Shape, with the selected pill sliding between them. The
// track is measured rather than assumed, so it survives any font or padding
// the design system brings with it.
function Segments({
  value,
  onChange,
  animate,
  styles,
}: {
  value: Facet
  onChange: (facet: Facet) => void
  animate: boolean
  styles: ReturnType<typeof createStyles>
}) {
  const [trackWidth, setTrackWidth] = useState(0)
  const segmentWidth = trackWidth > 0 ? (trackWidth - 6) / FACETS.length : 0
  const index = FACETS.findIndex((facet) => facet.key === value)
  const offset = useSharedValue(0)

  useEffect(() => {
    const target = index * segmentWidth
    offset.value = animate
      ? withTiming(target, { duration: 240, easing: Easing.out(Easing.cubic) })
      : target
  }, [animate, index, offset, segmentWidth])

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }))

  return (
    <View
      style={styles.segments}
      onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 && (
        <Animated.View style={[styles.segmentPill, { width: segmentWidth }, pillStyle]} />
      )}
      {FACETS.map((facet) => (
        <Pressable
          key={facet.key}
          style={styles.segment}
          onPress={() => onChange(facet.key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: facet.key === value }}
          accessibilityLabel={`${facet.label} tokens`}
        >
          <Text
            variant="label"
            color={facet.key === value ? 'accent' : 'secondary'}
            weight={facet.key === value ? 'semibold' : 'medium'}
          >
            {facet.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

function ColourPanel({
  colors,
  styles,
}: {
  colors: Colors
  styles: ReturnType<typeof createStyles>
}) {
  const swatches = [
    { name: 'Accent', value: colors.accent },
    { name: 'Success', value: colors.success },
    { name: 'Warning', value: colors.warning },
    { name: 'Danger', value: colors.danger },
    { name: 'Text', value: colors.text },
    { name: 'Surface', value: colors.surface },
  ]

  return (
    <View style={styles.swatches}>
      {swatches.map((swatch) => (
        <View key={swatch.name} style={styles.swatchItem}>
          <View style={[styles.swatch, { backgroundColor: swatch.value }]} />
          <Text variant="label">{swatch.name}</Text>
          <Text variant="caption" color="tertiary">
            {swatch.value}
          </Text>
        </View>
      ))}
    </View>
  )
}

function TypePanel({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View>
      {TYPE_SPECIMENS.map((specimen) => (
        <View key={specimen.variant} style={styles.specimen}>
          <Text variant={specimen.variant} numberOfLines={1}>
            {specimen.sample}
          </Text>
          <Text variant="caption" color="tertiary">
            {specimen.variant} · {specimen.size}
          </Text>
        </View>
      ))}
    </View>
  )
}

function ShapePanel({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={styles.shapeGroup}>
        <Text variant="caption" color="secondary" weight="semibold">
          Radius
        </Text>
        <View style={styles.shapeRow}>
          {RADII.map((radius) => (
            <View key={radius.name} style={styles.spaceItem}>
              <View style={[styles.radius, { borderRadius: radius.value }]} />
              <Text variant="caption" color="tertiary">
                {radius.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.shapeGroup}>
        <Text variant="caption" color="secondary" weight="semibold">
          Space
        </Text>
        <View style={styles.shapeRow}>
          {SPACES.map((space) => (
            <View key={space.name} style={styles.spaceItem}>
              <View style={[styles.spaceBar, { width: space.value }]} />
              <Text variant="caption" color="tertiary">
                {space.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

function RowLink({
  icon,
  title,
  subtitle,
  onPress,
  styles,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle: string
  onPress: () => void
  styles: ReturnType<typeof createStyles>
  colors: Colors
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={19} color={colors.accent} />
      </View>
      <View style={styles.rowText}>
        <Text variant="label">{title}</Text>
        <Text variant="caption" color="secondary">
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.tertiary} />
    </Pressable>
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

  // "See the tokens" jumps to the design-system card rather than opening
  // anything new — the screen is short enough to travel.
  const scrollRef = useRef<ScrollView>(null)
  const tokensY = useRef(0)
  const showTokens = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(tokensY.current - spacing.lg, 0), animated: true })
  }, [])

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
  const today = useMemo(
    () =>
      new Date()
        .toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
        .toUpperCase(),
    []
  )

  return (
    <View style={styles.container}>
      <View style={styles.backdrop} pointerEvents="none">
        <Glow clock={clock} colors={colors} style={[styles.glow, styles.glowOne]} drift={{ x: -30, y: 24 }} />
        <Glow clock={clock} colors={colors} style={[styles.glow, styles.glowTwo]} drift={{ x: 28, y: -18 }} />
        <Glow clock={clock} colors={colors} style={[styles.glow, styles.glowThree]} drift={{ x: -20, y: -30 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: tabBarPadding }}
        accessibilityLabel="Home screen"
      >
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.band, { paddingTop: insets.top + spacing.xl }]}
        >
          <View style={styles.bandTop}>
            <View style={styles.avatarWrap}>
              <Animated.View style={[styles.avatarRing, ringStyle]} pointerEvents="none" />
              <Avatar source={profile?.photo_url} name={displayName ?? 'Guest'} size="md" />
            </View>

            {/* A working control, not a badge: it switches the whole app's
                theme, and every colour on this screen follows. */}
            <Pressable
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              onPress={() => setMode(NEXT_MODE[mode])}
              accessibilityRole="button"
              accessibilityLabel={`Appearance: ${MODE_META[mode].label}`}
              accessibilityHint={`Double tap to switch to ${MODE_META[NEXT_MODE[mode]].label.toLowerCase()}`}
            >
              <Ionicons name={MODE_META[mode].icon} size={15} color={colors.accent} />
              <Text variant="label">{MODE_META[mode].label}</Text>
            </Pressable>
          </View>

          <View style={styles.greeting}>
            <Text variant="caption" color="tertiary" weight="semibold" style={styles.eyebrow}>
              {today}
            </Text>
            <Text variant="h1">{displayName ? `Hi, ${displayName}` : 'Welcome'}</Text>
            <Text variant="bodySmall" color="secondary">
              {user?.email ?? 'Your app, ready to be shaped.'}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.sections}>
          {/* The spotlight card — the shape a real app's first card takes:
              a label, a headline, a line of copy, two actions. */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Card>
              <View style={styles.cardText}>
                <View style={styles.eyebrowRow}>
                  <View style={styles.dot} />
                  <Text variant="caption" color="accent" weight="semibold" style={styles.eyebrow}>
                    YOUR APP
                  </Text>
                </View>
                <Text variant="h2">Make it yours</Text>
                <LinearGradient
                  colors={[colors.accent, `${colors.accent}00`]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.rule}
                />
                <Text variant="bodySmall" color="secondary">
                  Every colour, corner and shadow on this screen comes from one
                  theme file. Change a token there and the whole app follows —
                  starting here.
                </Text>
              </View>
              <View style={styles.actions}>
                <Button size="sm" onPress={showTokens}>
                  See the tokens
                </Button>
                <Button size="sm" variant="ghost" onPress={() => router.push('/(tabs)/profile')}>
                  Your profile
                </Button>
              </View>
            </Card>
          </Animated.View>

          {/* The design system, showing itself: palette, type scale, shapes. */}
          <Animated.View
            entering={FadeInDown.delay(180).duration(400)}
            onLayout={(event: LayoutChangeEvent) => {
              tokensY.current = event.nativeEvent.layout.y
            }}
          >
            <Card>
              <View style={styles.cardText}>
                <Text variant="h3">Design system</Text>
                <Text variant="bodySmall" color="secondary">
                  The tokens this app is drawn from, in {isDark ? 'dark' : 'light'} mode.
                </Text>
              </View>

              <Segments
                value={facet}
                onChange={setFacet}
                animate={animate}
                styles={styles}
              />

              <View style={styles.panel}>
                <Animated.View key={facet} entering={animate ? FadeIn.duration(220) : undefined}>
                  {facet === 'colour' && <ColourPanel colors={colors} styles={styles} />}
                  {facet === 'type' && <TypePanel styles={styles} />}
                  {facet === 'shape' && <ShapePanel styles={styles} />}
                </Animated.View>
              </View>
            </Card>
          </Animated.View>

          {/* Where to go next — real destinations, no dead ends. */}
          <Animated.View entering={FadeInDown.delay(260).duration(400)}>
            <Card>
              <View style={styles.rows}>
                <RowLink
                  icon="person-circle-outline"
                  title="Your profile"
                  subtitle="Photo, name and appearance"
                  onPress={() => router.push('/(tabs)/profile')}
                  styles={styles}
                  colors={colors}
                />
                {user ? (
                  <>
                    <View style={styles.divider} />
                    <RowLink
                      icon="create-outline"
                      title="Edit your details"
                      subtitle="Change how your name appears"
                      onPress={() => router.push('/(tabs)/edit-profile')}
                      styles={styles}
                      colors={colors}
                    />
                  </>
                ) : (
                  backendConfigured && (
                    <>
                      <View style={styles.divider} />
                      <RowLink
                        icon="log-in-outline"
                        title="Sign in"
                        subtitle="Bring your account with you"
                        onPress={() => router.push('/(auth)/sign-in')}
                        styles={styles}
                        colors={colors}
                      />
                    </>
                  )
                )}
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(340).duration(400)} style={styles.footer}>
            <Text variant="caption" color="tertiary">
              Every token on this screen lives in src/lib/theme.ts
            </Text>
          </Animated.View>
        </View>
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
