import { useColorScheme } from 'react-native'

import { getColors, getShadows, resolveIsDark, type Colors, type Shadows } from '@/src/lib/theme'
import { useThemeStore } from '@/src/stores/themeStore'

export function useIsDark(): boolean {
  const systemColorScheme = useColorScheme()
  const mode = useThemeStore((state) => state.mode)

  return resolveIsDark(mode, systemColorScheme)
}

export function useColors(): Colors {
  return getColors(useIsDark())
}

export function useShadows(): Shadows {
  return getShadows(useIsDark())
}
