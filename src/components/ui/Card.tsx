import { useMemo } from 'react'
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { useColors } from '@/src/hooks/useColors'
import { spacing, borderRadius, type Colors } from '@/src/lib/theme'

type CardVariant = 'elevated' | 'outlined' | 'filled'

type CardProps = {
  children: React.ReactNode
  variant?: CardVariant
  style?: StyleProp<ViewStyle>
  onPress?: PressableProps['onPress']
  accessibilityLabel?: string
  accessibilityHint?: string
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    base: {
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    elevated: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    outlined: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filled: {
      backgroundColor: colors.surface,
    },
    pressable: {
      // Additional styles when card is pressable
    },
  })

export function Card({
  children,
  variant = 'filled',
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  const cardStyle = [styles.base, styles[variant], style]

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </Pressable>
    )
  }

  return (
    <View style={cardStyle} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  )
}
