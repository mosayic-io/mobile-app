import { useMemo, type PropsWithChildren } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

import { useColors, useShadows } from '@/src/hooks/useColors'
import { spacing, borderRadius, type Colors, type Shadows } from '@/src/lib/theme'

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>
  /** Makes the whole card a button: it dips on press and calls this on release. */
  onPress?: () => void
  accessibilityLabel?: string
  accessibilityHint?: string
}>

// The spring a pressed card settles back with — quick, with a little overshoot.
const PRESS_SPRING = { damping: 14, stiffness: 260, mass: 0.6 }

const createStyles = (colors: Colors, shadows: Shadows) =>
  StyleSheet.create({
    card: {
      borderRadius: borderRadius.card,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge,
      padding: spacing.md,
      gap: spacing.sm + 2,
      ...shadows.card,
    },
    pressable: {
      flex: 1,
    },
  })

/**
 * Surface container — a white (or near-black) panel with the app's card
 * radius, a hairline edge and one soft shadow. The starting point for every
 * grouped thing on screen; give it `onPress` and it becomes a tile.
 */
export function Card({ children, style, onPress, accessibilityLabel, accessibilityHint }: CardProps) {
  const colors = useColors()
  const shadows = useShadows()
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows])

  const scale = useSharedValue(1)
  const pressed = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }))

  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>
  }

  return (
    <Animated.View style={[pressed, style]}>
      <Pressable
        style={[styles.card, styles.pressable]}
        onPress={onPress}
        onPressIn={() => scale.set(withSpring(0.96, PRESS_SPRING))}
        onPressOut={() => scale.set(withSpring(1, PRESS_SPRING))}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}
