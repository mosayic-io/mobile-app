import { useMemo, type PropsWithChildren } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useColors } from '@/src/hooks/useColors'
import { spacing, borderRadius, type Colors } from '@/src/lib/theme'

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>
}>

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      gap: spacing.md,
    },
  })

/**
 * Surface container — a themed panel that groups related content. The starting
 * point for whatever card treatment your design system calls for (elevation,
 * radii, borders all live here and in theme.ts).
 */
export function Card({ children, style }: CardProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return <View style={[styles.card, style]}>{children}</View>
}
