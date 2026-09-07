import { Platform, type ColorSchemeName } from 'react-native'

// The palette follows the iOS system palette: a grouped-background grey with
// white surfaces in light mode, pure black with #1C1C1E surfaces in dark, and
// secondary / tertiary text as translucent labels rather than greys — so they
// read the same over any surface.
export const lightColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#0B0B12',
  secondary: 'rgba(60, 60, 67, 0.6)',
  tertiary: 'rgba(60, 60, 67, 0.3)',
  // Hairline separators between rows; `edge` is the barely-there outline
  // around a card.
  border: 'rgba(60, 60, 67, 0.12)',
  edge: 'rgba(0, 0, 0, 0.04)',
  primary: '#0B0B12',
  onPrimary: '#FFFFFF',
  accent: '#5A5CF0',
  // The accent at 16% — avatar backgrounds, icon chips, selected states.
  accentSoft: 'rgba(90, 92, 240, 0.16)',
  danger: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  onDanger: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.4)',
  // Glass: the translucent fills over a blur — the nav bar and the tab bar.
  glassNav: 'rgba(242, 242, 247, 0.72)',
  glassTab: 'rgba(255, 255, 255, 0.68)',
  // Segmented control: the track and the sliding thumb.
  segmentTrack: 'rgba(118, 118, 128, 0.12)',
  segmentThumb: '#FFFFFF',
} as const

export const darkColors = {
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  secondary: 'rgba(235, 235, 245, 0.6)',
  tertiary: 'rgba(235, 235, 245, 0.3)',
  border: 'rgba(84, 84, 88, 0.65)',
  edge: 'rgba(255, 255, 255, 0.08)',
  primary: '#FFFFFF',
  onPrimary: '#000000',
  accent: '#8285F4',
  accentSoft: 'rgba(130, 133, 244, 0.16)',
  danger: '#FF453A',
  warning: '#FF9F0A',
  success: '#30D158',
  onDanger: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.6)',
  glassNav: 'rgba(0, 0, 0, 0.6)',
  glassTab: 'rgba(28, 28, 30, 0.66)',
  segmentTrack: 'rgba(118, 118, 128, 0.24)',
  segmentThumb: '#636366',
} as const

export type Colors = {
  background: string
  surface: string
  text: string
  secondary: string
  tertiary: string
  border: string
  edge: string
  primary: string
  onPrimary: string
  accent: string
  accentSoft: string
  danger: string
  warning: string
  success: string
  onDanger: string
  overlay: string
  glassNav: string
  glassTab: string
  segmentTrack: string
  segmentThumb: string
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

// The system font everywhere; a monospace face for token values and code.
export const fontFamily = {
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  }) as string,
}

// Two shapes carry the app: `card` for every surface that groups content,
// `control` for the things you press inside them. `sm` / `md` are for the
// small stuff (chips, thumbnails); `full` is a pill or a circle.
export const borderRadius = {
  sm: 8,
  md: 12,
  control: 14,
  card: 26,
  full: 9999,
} as const

// One soft elevation for cards. Deeper in the dark, where a light shadow
// would vanish against black.
type Shadow = {
  shadowColor: string
  shadowOpacity: number
  shadowRadius: number
  shadowOffset: { width: number; height: number }
  elevation: number
}

export type Shadows = {
  card: Shadow
}

const cardShadow = {
  shadowRadius: 30,
  shadowOffset: { width: 0, height: 10 },
  elevation: 3,
}

export const shadows: { light: Shadows; dark: Shadows } = {
  light: {
    card: { ...cardShadow, shadowColor: '#14142B', shadowOpacity: 0.07 },
  },
  dark: {
    card: { ...cardShadow, shadowColor: '#000000', shadowOpacity: 0.55 },
  },
}

export type ThemeMode = 'light' | 'dark' | 'system'

export function getColors(isDark: boolean): Colors {
  return isDark ? darkColors : lightColors
}

export function getShadows(isDark: boolean): Shadows {
  return isDark ? shadows.dark : shadows.light
}

// Single source of truth for resolving the effective color scheme.
// Used by both the useIsDark hook (via useColorScheme) and directly
// for non-hook contexts (e.g. class components like ErrorBoundary).
export function resolveIsDark(
  mode: ThemeMode,
  systemScheme: ColorSchemeName | null | undefined
): boolean {
  return mode === 'system' ? systemScheme === 'dark' : mode === 'dark'
}
