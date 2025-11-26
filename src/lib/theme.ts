export const lightColors = {
  background: '#fff',
  surface: '#f5f5f5',
  text: '#000',
  secondary: '#666',
  tertiary: '#999',
  border: '#ddd',
  primary: '#000',
  accent: '#007aff',
  danger: '#ff3b30',
  warning: '#ff9500',
  success: '#34c759',
} as const

export const darkColors = {
  background: '#000',
  surface: '#1c1c1e',
  text: '#fff',
  secondary: '#999',
  tertiary: '#666',
  border: '#333',
  primary: '#fff',
  accent: '#0a84ff',
  danger: '#ff453a',
  warning: '#ff9f0a',
  success: '#30d158',
} as const

export type Colors = {
  background: string
  surface: string
  text: string
  secondary: string
  tertiary: string
  border: string
  primary: string
  accent: string
  danger: string
  warning: string
  success: string
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
} as const

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const

export type ThemeMode = 'light' | 'dark' | 'system'

export function getColors(isDark: boolean): Colors {
  return isDark ? darkColors : lightColors
}
