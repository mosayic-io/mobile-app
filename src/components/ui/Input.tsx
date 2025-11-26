import { forwardRef, useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { useColors } from '@/src/hooks/useColors'
import { spacing, fontSize, fontWeight, borderRadius, type Colors } from '@/src/lib/theme'

type InputProps = TextInputProps & {
  label?: string
  error?: string
  hint?: string
  containerStyle?: StyleProp<ViewStyle>
  leftIcon?: keyof typeof Ionicons.glyphMap
  rightIcon?: keyof typeof Ionicons.glyphMap
  onRightIconPress?: () => void
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
    },
    inputContainerFocused: {
      borderColor: colors.accent,
    },
    inputContainerError: {
      borderColor: colors.danger,
    },
    leftIcon: {
      paddingLeft: spacing.md,
    },
    input: {
      flex: 1,
      padding: spacing.md,
      fontSize: fontSize.base,
      color: colors.text,
    },
    rightIconButton: {
      padding: spacing.md,
    },
    hint: {
      fontSize: fontSize.xs,
      color: colors.secondary,
      marginTop: spacing.xs,
    },
    error: {
      fontSize: fontSize.xs,
      color: colors.danger,
      marginTop: spacing.xs,
    },
  })

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    hint,
    containerStyle,
    leftIcon,
    rightIcon,
    onRightIconPress,
    secureTextEntry,
    ...props
  },
  ref
) {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [isFocused, setIsFocused] = useState(false)
  const [isSecureVisible, setIsSecureVisible] = useState(false)

  const isPassword = secureTextEntry !== undefined
  const showSecureToggle = isPassword && !rightIcon

  const handleFocus = (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
    setIsFocused(true)
    props.onFocus?.(e)
  }

  const handleBlur = (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
    setIsFocused(false)
    props.onBlur?.(e)
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={colors.tertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.tertiary}
          secureTextEntry={isPassword && !isSecureVisible}
          accessibilityLabel={label || props.placeholder}
          accessibilityHint={hint}
          accessibilityState={{ disabled: props.editable === false }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {showSecureToggle && (
          <Pressable
            onPress={() => setIsSecureVisible(!isSecureVisible)}
            style={styles.rightIconButton}
            accessibilityRole="button"
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={isSecureVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.tertiary}
            />
          </Pressable>
        )}
        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            accessibilityRole="button"
            disabled={!onRightIconPress}
          >
            <Ionicons name={rightIcon} size={20} color={colors.tertiary} />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text style={styles.hint} accessibilityRole="text">
          {hint}
        </Text>
      )}
    </View>
  )
})
