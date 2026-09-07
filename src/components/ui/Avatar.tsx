import { useMemo } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'

import { useColors } from '@/src/hooks/useColors'
import { fontSize, fontWeight, type Colors } from '@/src/lib/theme'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type AvatarProps = {
  source?: string | null
  name?: string | null
  size?: AvatarSize
  style?: StyleProp<ViewStyle>
}

const sizes: Record<AvatarSize, { container: number; text: number; glyph: number }> = {
  xs: { container: 24, text: fontSize.xs, glyph: 12 },
  sm: { container: 32, text: fontSize.sm, glyph: 16 },
  md: { container: 44, text: fontSize.lg, glyph: 20 },
  lg: { container: 64, text: fontSize.xl, glyph: 30 },
  xl: { container: 84, text: fontSize['3xl'], glyph: 38 },
}

const createStyles = (colors: Colors, size: AvatarSize) =>
  StyleSheet.create({
    // A wash of the accent with the initials (or a person) in the accent
    // itself — the same chip whether there's a name or not.
    container: {
      width: sizes[size].container,
      height: sizes[size].container,
      borderRadius: sizes[size].container / 2,
      backgroundColor: colors.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge,
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
      color: colors.accent,
    },
  })

function getInitials(name: string | null | undefined): string | null {
  if (!name) return null

  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return null
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
        <Image source={{ uri: source }} style={styles.image} contentFit="cover" transition={200} />
      ) : initials ? (
        <Text style={styles.text}>{initials}</Text>
      ) : (
        <Ionicons name="person" size={sizes[size].glyph} color={colors.accent} />
      )}
    </View>
  )
}
