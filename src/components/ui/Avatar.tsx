import { useMemo } from 'react'
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { useColors } from '@/src/hooks/useColors'
import { fontSize, fontWeight, type Colors } from '@/src/lib/theme'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type AvatarProps = {
  source?: string | null
  name?: string | null
  size?: AvatarSize
  style?: StyleProp<ViewStyle>
}

const sizes: Record<AvatarSize, { container: number; text: number }> = {
  xs: { container: 24, text: fontSize.xs },
  sm: { container: 32, text: fontSize.sm },
  md: { container: 48, text: fontSize.lg },
  lg: { container: 64, text: fontSize.xl },
  xl: { container: 80, text: fontSize['3xl'] },
}

const createStyles = (colors: Colors, size: AvatarSize) =>
  StyleSheet.create({
    container: {
      width: sizes[size].container,
      height: sizes[size].container,
      borderRadius: sizes[size].container / 2,
      backgroundColor: colors.tertiary,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    text: {
      fontSize: sizes[size].text,
      fontWeight: fontWeight.semibold,
      color: colors.background,
    },
  })

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function Avatar({ source, name, size = 'md', style }: AvatarProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors, size), [colors, size])

  const initials = getInitials(name)

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar for ${name}` : 'User avatar'}
    >
      {source ? (
        <Image source={{ uri: source }} style={styles.image} resizeMode="cover" />
      ) : (
        <Text style={styles.text}>{initials}</Text>
      )}
    </View>
  )
}
