import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, { useAnimatedStyle, withTiming, type SharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useColors, useIsDark } from '@/src/hooks/useColors'
import { spacing, type Colors } from '@/src/lib/theme'
import { Text } from './Text'

// The glass bar that takes over from a large title once it scrolls away:
// invisible while the title is on screen, then fades in with the title
// centred, the way a native navigation bar does. Screens draw their own
// large title in the content and hand this their scroll position.

type NavBarProps = {
  title: string
  /** The screen's vertical scroll offset, from `useAnimatedScrollHandler`. */
  scrollY: SharedValue<number>
  /** How far the content scrolls before the bar shows. */
  threshold?: number
}

const BAR_HEIGHT = 44

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    bar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 5,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      overflow: 'hidden',
    },
    fill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.glassNav,
    },
    title: {
      height: BAR_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
  })

export function NavBar({ title, scrollY, threshold = 44 }: NavBarProps) {
  const colors = useColors()
  const isDark = useIsDark()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors), [colors])

  const fade = useAnimatedStyle(() => ({
    opacity: withTiming(scrollY.get() > threshold ? 1 : 0, { duration: 220 }),
  }))

  return (
    <Animated.View style={[styles.bar, { paddingTop: insets.top }, fade]} pointerEvents="none">
      <BlurView
        intensity={40}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.fill} />
      <View style={styles.title}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {title}
        </Text>
      </View>
    </Animated.View>
  )
}
