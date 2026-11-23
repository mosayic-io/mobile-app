import { useEffect, useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  type SharedValue,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { Text } from '@/src/components/ui'
import { useColors, useShadows } from '@/src/hooks/useColors'
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding'
import { borderRadius, fontSize, spacing, type Colors, type Shadows } from '@/src/lib/theme'
import { ScreenErrorBoundary } from '@/src/components/error'

// The home screen is a placeholder: a mosaic of an app's pieces — chat, maps,
// photos, a calendar — that builds itself tile by tile, over a headline that
// writes itself in word by word. The motion plays once (tap the mosaic to
// play it again), then the screen is still. Colours come from the theme's
// decorative `mosaic` palette and the accent. Replace the whole screen with
// the app's real one when it's ready.

const TITLE = 'Your app starts here'
// Set as two balanced lines rather than left to wrap (which strands "here").
const TITLE_LINES = [['Your', 'app'], ['starts', 'here']]

// The page gutter: the iOS content margin.
const GUTTER = spacing.md + spacing.xs
const TILE = 52
const GAP = spacing.sm + 2
const GLYPH = 22

type Piece = { hue: 0 | 1 | 2 | 3; icon: keyof typeof Ionicons.glyphMap } | null

// The composition, row by row: eight coloured pieces of an app, eight quiet
// tiles between them. `hue` indexes the theme's mosaic palette.
const PIECES: Piece[][] = [
  [{ hue: 0, icon: 'chatbubble-ellipses' }, null, { hue: 1, icon: 'star' }, null],
  [null, { hue: 2, icon: 'map' }, null, { hue: 3, icon: 'heart' }],
  [{ hue: 1, icon: 'camera' }, null, null, { hue: 0, icon: 'calendar' }],
  [null, { hue: 3, icon: 'musical-notes' }, { hue: 2, icon: 'cart' }, null],
]
const LAST_DIAGONAL = PIECES.length + PIECES[0].length - 2

// Timing: tiles land one diagonal after another (glyphs a beat after their
// tile), a highlight sweeps across once, and the words follow the tiles in.
const FIRST_DELAY_MS = 120
const STEP_MS = 70
const GLYPH_LAG_MS = 160
const SHIMMER_DELAY_MS = FIRST_DELAY_MS + LAST_DIAGONAL * STEP_MS + 450
const SHIMMER_MS = 1100
const TITLE_DELAY_MS = 380
const WORD_STEP_MS = 90
const BODY_DELAY_MS = TITLE_DELAY_MS + TITLE.split(' ').length * WORD_STEP_MS + 200

const createStyles = (colors: Colors, shadows: Shadows) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Centred while it fits; scrolls when the largest text sizes make it tall.
    content: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: GUTTER,
      gap: spacing.xl + spacing.sm,
    },
    mosaic: {
      gap: GAP,
    },
    row: {
      flexDirection: 'row',
      gap: GAP,
    },
    tile: {
      width: TILE,
      height: TILE,
      borderRadius: borderRadius.control,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    // The shadow sits on a wrapper: overflow hidden (for the sheen) would clip it.
    tileShadow: {
      borderRadius: borderRadius.control,
      ...shadows.tile,
    },
    quietTile: {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge,
    },
    // A soft light across the top half: the tile reads as a raised piece.
    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '60%',
    },
    // A small dot in each quiet tile, so it's a piece too, not a gap.
    dot: {
      width: spacing.xs + 2,
      height: spacing.xs + 2,
      borderRadius: borderRadius.full,
      backgroundColor: colors.tertiary,
    },
    copy: {
      alignItems: 'center',
      gap: spacing.md,
      maxWidth: 340,
    },
    title: {
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    titleLine: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    titleWord: {
      fontSize: fontSize['4xl'],
      lineHeight: fontSize['4xl'] + 6,
      letterSpacing: -1,
    },
    centred: {
      textAlign: 'center',
    },
  })

type Styles = ReturnType<typeof createStyles>

function Tile({
  piece,
  diagonal,
  shimmer,
  animate,
  colors,
  styles,
}: {
  piece: Piece
  diagonal: number
  shimmer: SharedValue<number>
  animate: boolean
  colors: Colors
  styles: Styles
}) {
  // 0 → 1 as the tile lands, and as its glyph pops in just after.
  const landed = useSharedValue(animate ? 0 : 1)
  const glyph = useSharedValue(animate ? 0 : 1)

  useEffect(() => {
    if (!animate) return
    const delay = FIRST_DELAY_MS + diagonal * STEP_MS
    landed.set(withDelay(delay, withSpring(1, { damping: 14, stiffness: 180 })))
    glyph.set(withDelay(delay + GLYPH_LAG_MS, withSpring(1, { damping: 10, stiffness: 220 })))
  }, [animate, diagonal, glyph, landed])

  const tileStyle = useAnimatedStyle(() => {
    const progress = landed.get()
    // The highlight sits on one diagonal at a time: it lifts the tiles it
    // passes, fading to nothing a diagonal away.
    const position = interpolate(shimmer.get(), [0, 1], [-1, LAST_DIAGONAL + 1])
    const glow = Math.max(0, 1 - Math.abs(diagonal - position))
    return {
      opacity: Math.min(progress, 1),
      transform: [
        { translateY: interpolate(progress, [0, 1], [-14, 0]) - glow * 3 },
        { scale: interpolate(progress, [0, 1], [0.6, 1]) + glow * 0.06 },
      ],
    }
  })

  const glyphStyle = useAnimatedStyle(() => ({
    opacity: Math.min(glyph.get(), 1),
    transform: [{ scale: glyph.get() }, { rotate: `${interpolate(glyph.get(), [0, 1], [-20, 0])}deg` }],
  }))

  const hue = piece ? colors.mosaic[piece.hue] : null

  return (
    <Animated.View style={[styles.tileShadow, tileStyle]}>
      <View style={[styles.tile, hue ? { backgroundColor: hue } : styles.quietTile]}>
        {piece ? (
          <>
            <LinearGradient colors={colors.mosaicSheen} style={styles.sheen} />
            <Animated.View style={glyphStyle}>
              <Ionicons name={piece.icon} size={GLYPH} color={colors.onMosaic} />
            </Animated.View>
          </>
        ) : (
          <Animated.View style={[styles.dot, glyphStyle]} />
        )}
      </View>
    </Animated.View>
  )
}

function Mosaic({ animate, colors, styles }: { animate: boolean; colors: Colors; styles: Styles }) {
  const shimmer = useSharedValue(0)
  // Bumped on tap: remounting the tiles plays the entrance again.
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (!animate) return
    shimmer.set(0)
    shimmer.set(withDelay(SHIMMER_DELAY_MS, withTiming(1, { duration: SHIMMER_MS, easing: Easing.inOut(Easing.quad) })))
  }, [animate, run, shimmer])

  const replay = () => {
    if (!animate) return
    if (Platform.OS !== 'web') void Haptics.selectionAsync()
    setRun((current) => current + 1)
  }

  return (
    // Decoration: hidden from VoiceOver and TalkBack; the tap is a bonus, not a feature.
    <Pressable
      onPress={replay}
      style={styles.mosaic}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {PIECES.map((row, rowIndex) => (
        <View key={`${run}-${rowIndex}`} style={styles.row}>
          {row.map((piece, columnIndex) => (
            <Tile
              key={columnIndex}
              piece={piece}
              diagonal={rowIndex + columnIndex}
              shimmer={shimmer}
              animate={animate}
              colors={colors}
              styles={styles}
            />
          ))}
        </View>
      ))}
    </Pressable>
  )
}

// The headline arrives a word at a time, each rising into place. Read as one
// heading by screen readers; the words inside are hidden from them.
function Headline({ animate, styles }: { animate: boolean; styles: Styles }) {
  // The space between words grows with the system text size, like a real space.
  const { fontScale } = useWindowDimensions()

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={TITLE} style={styles.title}>
      {TITLE_LINES.map((line, lineIndex) => (
        <View key={lineIndex} style={[styles.titleLine, { columnGap: fontSize['4xl'] * 0.24 * fontScale }]}>
          {line.map((word, wordIndex) => {
            // Words count on across the lines, so the second line follows the first.
            const order = TITLE_LINES.slice(0, lineIndex).flat().length + wordIndex
            return (
              <Animated.View
                key={word}
                entering={
                  animate
                    ? FadeInDown.delay(TITLE_DELAY_MS + order * WORD_STEP_MS).springify().damping(16).stiffness(160)
                    : undefined
                }
              >
                <Text variant="h1" accessibilityRole="none" style={styles.titleWord}>
                  {word}
                </Text>
              </Animated.View>
            )
          })}
        </View>
      ))}
    </View>
  )
}

function HomeScreen() {
  const colors = useColors()
  const shadows = useShadows()
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows])
  const insets = useSafeAreaInsets()
  const tabBarPadding = useTabBarPadding()
  const animate = !useReducedMotion()
  const appear = (delay: number) => (animate ? FadeIn.delay(delay).duration(500) : undefined)

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={[
          styles.content,
          // The tab bar floats over the bottom, so the centre is measured above it.
          { paddingTop: insets.top + spacing.lg, paddingBottom: tabBarPadding },
        ]}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Home screen"
      >
        <Mosaic animate={animate} colors={colors} styles={styles} />

        <View style={styles.copy}>
          <Headline animate={animate} styles={styles} />

          <Animated.View entering={appear(BODY_DELAY_MS)}>
            <Text variant="body" color="secondary" style={styles.centred}>
              This screen is just a placeholder.
            </Text>
          </Animated.View>

          <Animated.View entering={appear(BODY_DELAY_MS + 250)}>
            <Text variant="body" color="secondary" style={styles.centred}>
              Ask Claude Code to change it, and watch it update right here.
            </Text>
          </Animated.View>
        </View>
      </Animated.ScrollView>
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
