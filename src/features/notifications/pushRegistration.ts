import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import { backendConfigured } from '@/src/lib/env'
import {
  addPushTokenChangeListener,
  getExpoPushToken,
  getNotificationPermissionStatus,
  removePushTokenFromDevice,
  requestNotificationPermissions,
  savePushTokenToDevice,
} from '@/src/lib/notifications'
import { supabase } from '@/src/lib/supabase'

// Push registration: keeps this device's row in the `devices` table in step
// with the Supabase session. It is driven entirely from here:
//
// - startPushSync(): called once from the root layout. Listens to the session
//   (supabase.auth.onAuthStateChange), the app returning to the foreground and
//   the OS rotating the push token, and re-saves the token on each of them.
// - unregisterPushBeforeSignOut(): the auth store awaits it right before
//   supabase.auth.signOut(). Deleting the row needs the user's JWT, and by the
//   time SIGNED_OUT reaches a listener the session is already gone.
// - useNotificationStore: the token / isRegistering / error, for UI.
//
// The token is re-saved on EVERY trigger rather than trusting the copy
// persisted on the phone, so a row removed server-side (on sign-out, by the
// backend after Expo reported the token invalid, by hand) comes back, a token
// the OS rotated is picked up, and notifications switched on later in system
// Settings start working. The upsert makes a repeat save harmless.
//
// The permission prompt: a fresh sign-in or sign-up may show it ('always');
// everything else (cold start, token refresh, foreground, rotation) only asks
// if the user has never been asked ('if-never-asked'), e.g. after a sign-in
// whose prompt did not show.

type MayPrompt = 'always' | 'if-never-asked'

type NotificationState = {
  expoPushToken: string | null
  isRegistering: boolean
  error: string | null
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (): NotificationState => ({
      expoPushToken: null,
      isRegistering: false,
      error: null,
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ expoPushToken: state.expoPushToken }),
    }
  )
)

const store = useNotificationStore

// The signed-in user this module registers for, taken from the auth events.
// null while signed out, and from the moment sign-out starts.
let currentUserId: string | null = null

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

async function syncToken(userId: string, mayPrompt: MayPrompt): Promise<void> {
  // Queued for a user who has since signed out (or been replaced): skip, or
  // the row a sign-out just removed would be saved again.
  if (currentUserId !== userId) return

  try {
    const status = await getNotificationPermissionStatus()
    const shouldPrompt = status !== 'granted' && (mayPrompt === 'always' || status === 'undetermined')
    const granted = status === 'granted' || (shouldPrompt && (await requestNotificationPermissions()))
    if (!granted) return

    store.setState({ isRegistering: true, error: null })
    const token = await getExpoPushToken()
    if (!token) {
      store.setState({ isRegistering: false, error: 'Could not get push token' })
      return
    }

    // The OS replaced the token: drop the old row so pushes are not sent to a dead token.
    const previous = store.getState().expoPushToken
    if (previous && previous !== token) {
      try {
        await removePushTokenFromDevice(userId, previous)
      } catch (error) {
        console.warn('Could not remove the previous push token:', error)
      }
    }

    await savePushTokenToDevice(userId, token)
    store.setState({ expoPushToken: token, isRegistering: false })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to register for notifications'
    console.error('Notification registration failed:', error)
    store.setState({ isRegistering: false, error: errorMessage })
  }
}

function sync(mayPrompt: MayPrompt): Promise<void> {
  const userId = currentUserId
  if (!userId) return Promise.resolve()
  if (mayPrompt === 'if-never-asked' && registrationInFlight) return registrationInFlight
  return runExclusive(() => syncToken(userId, mayPrompt))
}

function clearLocalToken() {
  store.setState({ expoPushToken: null, isRegistering: false, error: null })
}

/**
 * Await right before supabase.auth.signOut(): removes this device's row while
 * the user's JWT is still there, then forgets the token. Waits for a
 * registration in flight, and stops any queued one from saving it again.
 */
export async function unregisterPushBeforeSignOut(): Promise<void> {
  const userId = currentUserId
  currentUserId = null

  await runExclusive(async () => {
    const token = store.getState().expoPushToken
    if (userId && token) {
      try {
        await removePushTokenFromDevice(userId, token)
      } catch (error) {
        // Still forget the token locally even if the remote removal fails
        console.error('Failed to remove push token:', error)
      }
    }
    clearLocalToken()
  })
}

/**
 * Starts keeping the push token in step with the session. Call once, from the
 * root layout; returns the unsubscribe. A no-op with no backend configured
 * (src/lib/env.ts) and on web, where there are no push notifications.
 */
export function startPushSync(): () => void {
  if (!backendConfigured || Platform.OS === 'web') return () => {}

  // Telling a fresh sign-in from a restored session: supabase emits SIGNED_IN
  // for both — the client recovers the stored session at start-up (and on web
  // whenever a tab regains focus) with SIGNED_IN too, and that can reach this
  // listener before INITIAL_SESSION. So events before INITIAL_SESSION are
  // ignored (INITIAL_SESSION reports the restored session itself), and after
  // it, a SIGNED_IN counts as fresh only when it brings a user this module was
  // not already registering for: going from signed out (or another user) to
  // signed in is an interactive sign-in, sign-up or confirmed email link in
  // this app. A SIGNED_IN for the user already signed in is a recovery.
  let initialSessionSeen = false
  let stopped = false

  const handleAuthChange = (event: AuthChangeEvent, session: Session | null) => {
    if (stopped) return
    if (event === 'INITIAL_SESSION') initialSessionSeen = true
    if (!initialSessionSeen) return

    const userId = session?.user?.id ?? null
    if (!userId) {
      // SIGNED_OUT (or no session at start-up). The session is gone, so the
      // row can't be deleted here; a sign-out from the app already removed it
      // in unregisterPushBeforeSignOut. Account deletion and a session that
      // expired or was revoked elsewhere only need the local copy forgotten.
      currentUserId = null
      if (event === 'SIGNED_OUT') clearLocalToken()
      return
    }

    const isFreshSignIn = event === 'SIGNED_IN' && userId !== currentUserId
    currentUserId = userId
    void sync(isFreshSignIn ? 'always' : 'if-never-asked')
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    // Never await supabase inside this callback (it holds the auth lock, so a
    // call from here can deadlock): defer the work, as the supabase docs advise.
    setTimeout(() => handleAuthChange(event, session), 0)
  })

  // Back in the foreground: re-save (notifications may have been switched on in Settings)
  const appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') void sync('if-never-asked')
  })

  // The OS rotated this device's push token while the app was running
  const tokenSubscription = addPushTokenChangeListener(() => void sync('if-never-asked'))

  return () => {
    stopped = true
    subscription.unsubscribe()
    appStateSubscription.remove()
    tokenSubscription.remove()
  }
}
