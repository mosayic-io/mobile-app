import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'
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

// True once the persisted theme has been read back from AsyncStorage.
// The root layout holds the splash screen until then so the first frame
// renders in the correct theme.
export function useThemeHydration(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => useThemeStore.persist.onFinishHydration(onStoreChange),
    () => useThemeStore.persist.hasHydrated(),
    () => false
  )
}
