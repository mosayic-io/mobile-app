import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { ThemeMode } from '@/src/lib/theme'

type ThemeState = {
  mode: ThemeMode
}

type ThemeActions = {
  setMode: (mode: ThemeMode) => void
}

type ThemeStore = ThemeState & ThemeActions

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'system',

      setMode: (mode: ThemeMode) => {
        set({ mode })
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
