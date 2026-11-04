import { useMemo } from 'react'
import {
  Text as RNText,
  StyleSheet,
  type TextProps as RNTextProps,
  type StyleProp,
  type TextStyle,
} from 'react-native'

import { useColors } from '@/src/hooks/useColors'
import { fontFamily, fontSize, typeface, type Colors } from '@/src/lib/theme'

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label' | 'mono'
type TextColor = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'danger' | 'success'

type TextProps = RNTextProps & {
  variant?: TextVariant
  color?: TextColor
  weight?: keyof typeof typeface
  style?: StyleProp<TextStyle>
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    // Variants
    h1: {
      // The large title at the top of a screen.
      fontSize: fontSize['3xl'],
      lineHeight: fontSize['3xl'] + 7,
      ...typeface.bold,
      letterSpacing: -0.6,
      color: colors.text,
    },
    h2: {
      fontSize: fontSize['2xl'],
      ...typeface.bold,
      color: colors.text,
    },
    h3: {
      fontSize: fontSize.xl,
      ...typeface.semibold,
      letterSpacing: -0.2,
      color: colors.text,
    },
    body: {
      fontSize: fontSize.base,
      ...typeface.normal,
      color: colors.text,
    },
    bodySmall: {
      fontSize: fontSize.sm,
      ...typeface.normal,
      color: colors.text,
    },
    caption: {
      fontSize: fontSize.xs,
      ...typeface.normal,
      color: colors.secondary,
    },
    label: {
      fontSize: fontSize.sm,
      ...typeface.medium,
      color: colors.text,
    },
    // Token values, versions, file names — anything that's really code.
    mono: {
      fontFamily: fontFamily.mono,
      fontSize: fontSize.xs,
      color: colors.secondary,
    },
    // Colors
    colorPrimary: {
      color: colors.text,
    },
    colorSecondary: {
      color: colors.secondary,
    },
    colorTertiary: {
      color: colors.tertiary,
    },
    colorAccent: {
      color: colors.accent,
    },
    colorDanger: {
      color: colors.danger,
    },
    colorSuccess: {
      color: colors.success,
    },
    // Weights
    weightNormal: {
      ...typeface.normal,
    },
    weightMedium: {
      ...typeface.medium,
    },
    weightSemibold: {
      ...typeface.semibold,
    },
    weightBold: {
      ...typeface.bold,
    },
  })

export function Text({
  variant = 'body',
  color,
  weight,
  style,
  children,
  ...props
}: TextProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <RNText
      style={[
        styles[variant],
        color && styles[`color${color.charAt(0).toUpperCase()}${color.slice(1)}` as keyof typeof styles],
        weight && styles[`weight${weight.charAt(0).toUpperCase()}${weight.slice(1)}` as keyof typeof styles],
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  )
}
