import { useColorScheme } from 'react-native'

import { getColors, type Colors } from '@/src/lib/theme'
import { useThemeStore } from '@/src/stores/themeStore'

export function useColors(): Colors {
  const systemColorScheme = useColorScheme()
  const mode = useThemeStore((state) => state.mode)

  const isDark =
    mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark'

  return getColors(isDark)
}

export function useIsDark(): boolean {
  const systemColorScheme = useColorScheme()
  const mode = useThemeStore((state) => state.mode)

  return mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark'
}
