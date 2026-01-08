import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import {
  registerForPushNotifications,
  savePushTokenToDevice,
  removePushTokenFromDevice,
} from '@/src/lib/notifications'

type NotificationState = {
  expoPushToken: string | null
  isRegistering: boolean
  error: string | null
}

type NotificationActions = {
  registerAndSaveToken: (userId: string) => Promise<void>
  ensureToken: (userId: string) => Promise<void>
  removeToken: (userId: string) => Promise<void>
  clearToken: () => void
}

type NotificationStore = NotificationState & NotificationActions

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      expoPushToken: null,
      isRegistering: false,
      error: null,

      registerAndSaveToken: async (userId: string) => {
        set({ isRegistering: true, error: null })

        try {
          const token = await registerForPushNotifications()

          if (token) {
            await savePushTokenToDevice(userId, token)
            set({ expoPushToken: token, isRegistering: false })
          } else {
            set({
              isRegistering: false,
              error: 'Could not get push token',
            })
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to register for notifications'
          console.error('Notification registration failed:', error)
          set({ isRegistering: false, error: errorMessage })
        }
      },

      ensureToken: async (userId: string) => {
        // Avoid repeated registration while a token is already present or registration in progress
        if (get().isRegistering || get().expoPushToken) return

        await get().registerAndSaveToken(userId)
      },

      removeToken: async (userId: string) => {
        try {
          const token = get().expoPushToken
          if (token) {
            await removePushTokenFromDevice(userId, token)
          }
          set({ expoPushToken: null, error: null })
        } catch (error) {
          console.error('Failed to remove push token:', error)
          // Still clear local token even if remote removal fails
          set({ expoPushToken: null })
        }
      },

      clearToken: () => {
        set({ expoPushToken: null, error: null })
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ expoPushToken: state.expoPushToken }),
    }
  )
)
