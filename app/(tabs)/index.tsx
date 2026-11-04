import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { setStatusBarStyle } from 'expo-status-bar'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from 'expo-router'
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  LinearTransition,
  interpolate,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

import { NavBar, Segmented, Text } from '@/src/components/ui'
import { useColors, useIsDark } from '@/src/hooks/useColors'
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding'
import { borderRadius, spacing, type Colors } from '@/src/lib/theme'
import { ScreenErrorBoundary } from '@/src/components/error'

// The home screen is a placeholder that looks like a real first screen: a
// picture across the top, a few words under it, pill tabs, then a list with
// an empty state for when it runs out. It's deliberately nobody's app — the
// list is the making of this app itself — and it's built only from the
// theme tokens (src/lib/theme.ts) and the UI primitives (src/components/ui),
// so a change to either shows up here first.
//
// Every control works: the tabs filter the list, and tapping a step ticks it
// off (in memory only — nothing is saved). Replace the whole screen with the
// app's real one when it's ready.

// The picture is fetched, not bundled — nothing to delete when you replace
// it with your own. (Unsplash; free to use.)
const HERO = {
  uri: 'https://images.unsplash.com/photo-1594730900439-6a1bb8504ea4?fm=jpg&q=70&w=1200&auto=format&fit=crop',
}

type Step = {
  id: string
  title: string
  detail: string
  time: string
  icon: keyof typeof Ionicons.glyphMap
  /** The thumbnail's tint, as [light, dark] — a soft wash behind the glyph. */
  tint: readonly [string, string]
  done: boolean
}

// The list: the road this app takes from an idea to the stores.
const STEPS: Step[] = [
  {
    id: 'idea',
    title: 'Describe the idea',
    detail: 'The PRD says who this app is for',
    time: 'An evening',
    icon: 'bulb',
    tint: ['#F5B300', '#FFC933'],
    done: true,
  },
  {
    id: 'phone',
    title: 'Get it on a phone',
    detail: "You're looking at it",
    time: 'An afternoon',
    icon: 'phone-portrait',
    tint: ['#2F80ED', '#5AA0FF'],
    done: true,
  },
  {
    id: 'look',
    title: 'Give it a look',
    detail: 'It all lives in theme.ts',
    time: 'A day',
    icon: 'color-palette',
    tint: ['#EB5757', '#FF7A7A'],
    done: false,
  },
  {
    id: 'screens',
    title: 'Build the real screens',
    detail: 'Starting with this one',
    time: 'A few weeks',
    icon: 'layers',
    tint: ['#14A38B', '#3CCBB2'],
    done: false,
  },
  {
    id: 'backend',
    title: 'Connect the backend',
    detail: 'Supabase keeps your users and data',
    time: 'A day',
    icon: 'server',
    tint: ['#F2994A', '#FFB070'],
    done: false,
  },
  {
    id: 'ship',
    title: 'Ship it',
    detail: 'The App Store and Google Play',
    time: 'A week, with review',
    icon: 'paper-plane',
    tint: ['#0B0B12', '#FFFFFF'],
    done: false,
  },
]

const FILTERS = [
  { value: 'todo', label: 'To do' },
  { value: 'done', label: 'Done' },
] as const

type Filter = (typeof FILTERS)[number]['value']

// The page gutter: the iOS content margin.
const GUTTER = spacing.md + spacing.xs
const HERO_HEIGHT = 300
const THUMB = 64
// A tick lands, then the row leaves the tab it's on this long after.
const SETTLE_MS = 450

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    // Hero: full-bleed, under the status bar, fading into the page.
    hero: {
      height: HERO_HEIGHT,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    // The fade is solid for its last fifth and runs a pixel past the edge:
    // scaled down (the dashboard's phone), a fade that ends exactly on the
    // edge leaves a half-covered row of photo showing as a grey line.
    heroFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -2,
      height: HERO_HEIGHT * 0.5,
    },
    heroScrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 120,
    },
    body: {
      paddingHorizontal: GUTTER,
      marginTop: -spacing.xl,
      gap: spacing.lg,
    },
    intro: {
      gap: spacing.sm,
    },
    // The extra air between the tabs and the list is on purpose.
    list: {
      marginTop: spacing.md,
    },
    // A row: thumbnail, words, tick.
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    rowPressed: {
      opacity: 0.6,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: THUMB + spacing.md,
    },
    thumbWrap: {
      width: THUMB,
      alignItems: 'center',
    },
    thumb: {
      width: THUMB,
      height: THUMB,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // The status pill sits over the thumbnail's bottom edge.
    badge: {
      marginTop: -11,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
      borderWidth: 2,
      borderColor: colors.background,
    },
    rowText: {
      flex: 1,
      gap: 3,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    // The tick: an empty ring, or a filled disc with a check.
    tick: {
      width: 26,
      height: 26,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
    },
    // Empty state
    empty: {
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      marginBottom: spacing.xs,
    },
    centred: {
      textAlign: 'center',
    },
  })

type Styles = ReturnType<typeof createStyles>

// The picture, drifting: a slow push in and a few pixels of travel over
// sixteen seconds, then back out — the lock-screen photo effect.
function Hero({
  clock,
  colors,
  styles,
}: {
  clock: SharedValue<number>
  colors: Colors
  styles: Styles
}) {
  const animated = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(clock.get(), [0, 1], [1.02, 1.1]) },
      { translateX: interpolate(clock.get(), [0, 1], [0, -10]) },
    ],
  }))

  return (
    <View style={styles.hero} accessibilityRole="image" accessibilityLabel="Cover picture">
      <Animated.View style={[styles.heroImage, animated]}>
        <Image source={HERO} style={styles.heroImage} contentFit="cover" transition={300} />
      </Animated.View>
      {/* A dark wash under the status bar, so the clock reads over any picture. */}
      <LinearGradient colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0)']} style={styles.heroScrim} />
      <LinearGradient
        colors={[`${colors.background}00`, colors.background, colors.background]}
        locations={[0, 0.8, 1]}
        style={styles.heroFade}
      />
    </View>
  )
}

// The tick pops when it lands.
function Tick({ checked, colors, styles }: { checked: boolean; colors: Colors; styles: Styles }) {
  const scale = useSharedValue(1)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    scale.set(withSequence(withTiming(0.82, { duration: 90 }), withSpring(1, { damping: 9, stiffness: 320 })))
  }, [checked, scale])

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }))

  return (
    <Animated.View
      style={[
        styles.tick,
        checked
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { borderColor: colors.tertiary },
        pop,
      ]}
    >
      {checked && <Ionicons name="checkmark" size={16} color={colors.onPrimary} />}
    </Animated.View>
  )
}

function StepRow({
  step,
  checked,
  onToggle,
  colors,
  isDark,
  styles,
}: {
  step: Step
  checked: boolean
  onToggle: () => void
  colors: Colors
  isDark: boolean
  styles: Styles
}) {
  const tint = step.tint[isDark ? 1 : 0]

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={step.title}
      accessibilityHint={checked ? 'Double tap to untick' : 'Double tap to tick off'}
    >
      <View style={styles.thumbWrap}>
        <View style={[styles.thumb, { backgroundColor: `${tint}22` }]}>
          <Ionicons name={step.icon} size={26} color={tint} />
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: checked ? colors.primary : colors.surface },
          ]}
        >
          <Text
            variant="caption"
            weight="semibold"
            style={{ color: checked ? colors.onPrimary : colors.secondary }}
          >
            {checked ? 'Done' : 'To do'}
          </Text>
        </View>
      </View>

      <View style={styles.rowText}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {step.title}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="document-text-outline" size={14} color={colors.secondary} />
          <Text variant="bodySmall" color="secondary" numberOfLines={1} style={styles.rowText}>
            {step.detail}
          </Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={14} color={colors.secondary} />
          <Text variant="bodySmall" color="secondary" numberOfLines={1}>
            {step.time}
          </Text>
        </View>
      </View>

      <Tick checked={checked} colors={colors} styles={styles} />
    </Pressable>
  )
}

function EmptyState({ filter, colors, styles }: { filter: Filter; colors: Colors; styles: Styles }) {
  const copy =
    filter === 'done'
      ? { icon: 'checkmark-done' as const, title: 'Nothing done yet', body: 'Tap a step to tick it off.' }
      : { icon: 'sparkles' as const, title: 'All done', body: 'Every step is ticked off. Time to ship it.' }

  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={copy.icon} size={24} color={colors.secondary} />
      </View>
      <Text variant="body" weight="semibold" style={styles.centred}>
        {copy.title}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.centred}>
        {copy.body}
      </Text>
    </View>
  )
}

function HomeScreen() {
  const colors = useColors()
  const isDark = useIsDark()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const tabBarPadding = useTabBarPadding()
  const animate = !useReducedMotion()

  const [filter, setFilter] = useState<Filter>('todo')
  // What each row shows, and — a beat later — which tab it lives on, so a
  // tick is seen landing before the row leaves.
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(STEPS.map((step) => [step.id, step.done]))
  )
  const [settled, setSettled] = useState(checked)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  useEffect(() => {
    const pending = timers.current
    return () => Object.values(pending).forEach(clearTimeout)
  }, [])

  const toggle = (id: string) => {
    const next = !checked[id]
    void Haptics.selectionAsync()
    setChecked((current) => ({ ...current, [id]: next }))
    clearTimeout(timers.current[id])
    timers.current[id] = setTimeout(() => setSettled((current) => ({ ...current, [id]: next })), SETTLE_MS)
  }

  // The scroll position drives the glass NavBar, and the status bar: light
  // over the picture, the theme's own once the bar has taken over.
  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y)
  })
  const threshold = HERO_HEIGHT - insets.top - 44
  const [overHero, setOverHero] = useState(true)
  useAnimatedReaction(
    () => scrollY.get() < threshold,
    (now, before) => {
      if (now !== before) scheduleOnRN(setOverHero, now)
    }
  )
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(overHero ? 'light' : 'auto')
      return () => setStatusBarStyle('auto')
    }, [overHero])
  )

  // One slow 0 → 1 → 0 clock for the picture's drift.
  const heroClock = useSharedValue(0)
  useEffect(() => {
    heroClock.set(
      animate
        ? withRepeat(withTiming(1, { duration: 16_000, easing: Easing.inOut(Easing.sin) }), -1, true)
        : 0
    )
  }, [animate, heroClock])

  const visible = STEPS.filter((step) => (filter === 'done' ? settled[step.id] : !settled[step.id]))

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: tabBarPadding, minHeight: height }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Home screen"
      >
        <Hero clock={heroClock} colors={colors} styles={styles} />

        <View style={styles.body}>
          <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.intro}>
            <Text variant="h1">Your app starts here</Text>
            <Text variant="body" color="secondary">
              Everything on this screen is a stand-in, built from the same pieces your real
              screens will use. Swap it out as soon as you know what goes here.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(450)}>
            <Segmented
              options={FILTERS}
              value={filter}
              onChange={setFilter}
              accessibilityLabel="Filter the steps"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.list}>
            {visible.length === 0 ? (
              <Animated.View key={filter} entering={animate ? FadeIn.duration(220) : undefined}>
                <EmptyState filter={filter} colors={colors} styles={styles} />
              </Animated.View>
            ) : (
              visible.map((step, index) => (
                <Animated.View
                  key={step.id}
                  entering={animate ? FadeIn.duration(220) : undefined}
                  layout={animate ? LinearTransition.duration(220) : undefined}
                >
                  {index > 0 && <View style={styles.separator} />}
                  <StepRow
                    step={step}
                    checked={checked[step.id]}
                    onToggle={() => toggle(step.id)}
                    colors={colors}
                    isDark={isDark}
                    styles={styles}
                  />
                </Animated.View>
              ))
            )}
          </Animated.View>
        </View>
      </Animated.ScrollView>

      <NavBar scrollY={scrollY} threshold={threshold} />
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
