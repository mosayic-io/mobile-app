import { useColorScheme } from 'react-native'

import { getColors, resolveIsDark, type Colors } from '@/src/lib/theme'
import { useThemeStore } from '@/src/stores/themeStore'

export function useIsDark(): boolean {
  const systemColorScheme = useColorScheme()
  const mode = useThemeStore((state) => state.mode)

  return resolveIsDark(mode, systemColorScheme)
}

export function useColors(): Colors {
  return getColors(useIsDark())
}
