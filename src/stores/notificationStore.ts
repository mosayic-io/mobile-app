import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import {
  getExpoPushToken,
  getNotificationPermissionStatus,
  requestNotificationPermissions,
  savePushTokenToDevice,
  removePushTokenFromDevice,
} from '@/src/lib/notifications'

// Owns this device's push token for the signed-in user. Nothing here runs
// without a session: every caller passes the signed-in user's id.
//
// - registerAndSaveToken: called right after a sign-in or sign-up that
//   produced a session. Shows the system permission prompt if needed.
// - ensureToken: called on cold start, on every auth state change and each
//   time the app returns to the foreground. It re-saves the token EVERY time
//   rather than trusting the copy persisted on the phone, so a row removed
//   server-side (on sign-out, by the backend after Expo reported the token
//   invalid, by hand) comes back, a token the OS rotated is picked up, and
//   notifications switched on later in system Settings start working. The
//   upsert makes a repeat save harmless. It only asks for permission if the
//   user has never been asked (after a sign-in whose prompt did not show).

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

// One registration at a time. A silent check joins one already running; a
// sign-in waits for it to finish and then runs its own, so the sign-in's
// permission prompt is never swallowed by a check that started just before.
let registrationInFlight: Promise<void> | null = null

async function runExclusive(work: () => Promise<void>): Promise<void> {
  while (registrationInFlight) await registrationInFlight
  const run = work().finally(() => {
    if (registrationInFlight === run) registrationInFlight = null
  })
  registrationInFlight = run
  return run
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => {
      const syncToken = async (userId: string, mayPrompt: 'always' | 'if-never-asked') => {
        try {
          const status = await getNotificationPermissionStatus()
          const shouldPrompt = status !== 'granted' && (mayPrompt === 'always' || status === 'undetermined')
          const granted = status === 'granted' || (shouldPrompt && (await requestNotificationPermissions()))
          if (!granted) return

          set({ isRegistering: true, error: null })
          const token = await getExpoPushToken()
          if (!token) {
            set({ isRegistering: false, error: 'Could not get push token' })
            return
          }

          // The OS replaced the token: drop the old row so pushes are not sent to a dead token.
          const previous = get().expoPushToken
          if (previous && previous !== token) {
            try {
              await removePushTokenFromDevice(userId, previous)
            } catch (error) {
              console.warn('Could not remove the previous push token:', error)
            }
          }

          await savePushTokenToDevice(userId, token)
          set({ expoPushToken: token, isRegistering: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to register for notifications'
          console.error('Notification registration failed:', error)
          set({ isRegistering: false, error: errorMessage })
        }
      }

      return {
        expoPushToken: null,
        isRegistering: false,
        error: null,

        registerAndSaveToken: (userId: string) => runExclusive(() => syncToken(userId, 'always')),

        ensureToken: (userId: string) => {
          if (registrationInFlight) return registrationInFlight
          return runExclusive(() => syncToken(userId, 'if-never-asked'))
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
      }
    },
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ expoPushToken: state.expoPushToken }),
    }
  )
)
