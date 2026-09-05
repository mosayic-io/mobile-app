import type { ColorSchemeName } from 'react-native'

export const lightColors = {
  background: '#fff',
  surface: '#f5f5f5',
  text: '#000',
  secondary: '#666',
  tertiary: '#999',
  border: '#ddd',
  primary: '#000',
  accent: '#5a5cf0',
  danger: '#ff3b30',
  warning: '#ff9500',
  success: '#34c759',
  onDanger: '#fff',
  overlay: 'rgba(0, 0, 0, 0.4)',
  // Glass surfaces (Card, tab bar): a translucent fill over a blur, with a
  // lighter hairline edge — the "liquid glass" look. Alpha is the point.
  glassFill: 'rgba(255, 255, 255, 0.62)',
  glassEdge: 'rgba(255, 255, 255, 0.9)',
} as const

export const darkColors = {
  background: '#000',
  surface: '#1c1c1e',
  text: '#fff',
  secondary: '#999',
  tertiary: '#666',
  border: '#333',
  primary: '#fff',
  accent: '#8285f4',
  danger: '#ff453a',
  warning: '#ff9f0a',
  success: '#30d158',
  onDanger: '#fff',
  overlay: 'rgba(0, 0, 0, 0.6)',
  glassFill: 'rgba(28, 28, 30, 0.55)',
  glassEdge: 'rgba(255, 255, 255, 0.14)',
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
  onDanger: string
  overlay: string
  glassFill: string
  glassEdge: string
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

// Single source of truth for resolving the effective color scheme.
// Components should use the useIsDark()/useColors() hooks; this helper exists
// for non-hook contexts (e.g. class components like ErrorBoundary).
export function resolveIsDark(
  mode: ThemeMode,
  systemScheme: ColorSchemeName | null | undefined
): boolean {
  return mode === 'system' ? systemScheme === 'dark' : mode === 'dark'
}
