import { useMemo, type PropsWithChildren } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'

import { useColors, useIsDark } from '@/src/hooks/useColors'
import { spacing, borderRadius, type Colors } from '@/src/lib/theme'

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>
}>

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    // Shadow lives on the outer view; the inner one clips the blur to the
    // radius (a single view can't do both on Android).
    shadow: {
      borderRadius: borderRadius.lg,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 3,
    },
    shell: {
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.glassEdge,
      backgroundColor: colors.glassFill,
    },
    body: {
      padding: spacing.lg,
      gap: spacing.md,
    },
  })

/**
 * Surface container — a glass panel: a blur of whatever sits behind it,
 * under a translucent fill, with a hairline edge. The starting point for
 * whatever card treatment your design system calls for; the fill and edge
 * colours are theme tokens (glassFill / glassEdge), the radius and padding
 * live here.
 */
export function Card({ children, style }: CardProps) {
  const colors = useColors()
  const isDark = useIsDark()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={[styles.shadow, style]}>
      <View style={styles.shell}>
        <BlurView
          intensity={isDark ? 30 : 45}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.body}>{children}</View>
      </View>
    </View>
  )
}
