import { useMemo, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native'

import { useColors } from '@/src/hooks/useColors'
import { spacing, fontSize, fontWeight, borderRadius, type Colors } from '@/src/lib/theme'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = Omit<PressableProps, 'style'> & {
  children: string
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

const sizeStyles = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: spacing.md + 4, paddingHorizontal: spacing.xl },
} as const

const textSizeStyles = {
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.base },
  lg: { fontSize: fontSize.lg },
} as const

const createStyles = (colors: Colors) => {
  const variantStyles = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surface },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.danger },
  } as const

  const textVariantStyles = {
    primary: { color: colors.background },
    secondary: { color: colors.text },
    outline: { color: colors.text },
    ghost: { color: colors.text },
    danger: { color: '#fff' },
  } as const

  return {
    base: StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
      },
      fullWidth: { width: '100%' },
      disabled: { opacity: 0.6 },
      textBase: { fontWeight: fontWeight.semibold },
      loader: { marginRight: spacing.sm },
      icon: { marginRight: spacing.sm },
    }),
    variant: variantStyles,
    textVariant: textVariantStyles,
  }
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  leftIcon,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  const isDisabled = disabled || loading
  const loaderColor = variant === 'primary' || variant === 'danger' ? colors.background : colors.text

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={[
        styles.base.container,
        sizeStyles[size],
        styles.variant[variant],
        fullWidth && styles.base.fullWidth,
        isDisabled && styles.base.disabled,
        style,
      ]}
      {...props}
    >
      {loading && (
        <ActivityIndicator size="small" color={loaderColor} style={styles.base.loader} />
      )}
      {leftIcon ? <View style={styles.base.icon}>{leftIcon}</View> : null}
      <Text
        style={[
          styles.base.textBase,
          textSizeStyles[size],
          styles.textVariant[variant],
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  )
}
