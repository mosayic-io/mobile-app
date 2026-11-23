import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

import { backendConfigured } from '@/src/lib/env'
import { EMAIL_CONFIRMED_URL, RESET_PASSWORD_URL } from '@/src/lib/links'
import { supabase } from '@/src/lib/supabase'
import { queryClient } from '@/src/lib/queryClient'
import { unregisterPushBeforeSignOut } from '@/src/features/notifications'
import { deleteAuthUser } from '@/src/lib/api'

import { awaitConfirmation } from '../pendingConfirmation'
import { signInWith, type SignInMethod, type SignInOutcome } from '../providers'

// Email confirmation is OFF by default (the API repo's supabase/config.toml,
// and the hosted project's "Confirm email" toggle): sign up, and you're in.
// Everything still works when it is switched ON — sign-up then returns no
// session and 'awaiting-confirmation', and ../pendingConfirmation.ts takes
// over until the link in the email is opened.

/** Confirmation off: 'signed-in'. Confirmation on: 'awaiting-confirmation' until the link is opened. */
export type SignUpOutcome = 'signed-in' | 'awaiting-confirmation'

type AuthState = {
  session: Session | null
  user: User | null
  isInitialized: boolean
  initError: Error | null
}

type AuthActions = {
  initialize: () => Promise<void>
  /** Google, Apple or email + password; 'cancelled' when the person backs out of the provider's sheet. */
  signIn: (method: SignInMethod) => Promise<SignInOutcome>
  signUp: (email: string, password: string) => Promise<SignUpOutcome>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  setupAuthListener: () => () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  isInitialized: false,
  initError: null,

  setupAuthListener: () => {
    // No backend yet: nothing to listen to (see src/lib/env.ts, "unconfigured mode")
    if (!backendConfigured) {
      return () => {}
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  },

  initialize: async () => {
    const { isInitialized, initError } = get()
    if (isInitialized && !initError) return

    // Reset init state when retrying after a failure
    if (initError) {
      set({ isInitialized: false, initError: null })
    }

    // No backend yet: boot signed out without touching Supabase. The sign-in
    // actions below still throw the clear "not configured" error if used.
    if (!backendConfigured) {
      set({ session: null, user: null, isInitialized: true, initError: null })
      return
    }

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      const user = data.session?.user ?? null

      set({
        session: data.session,
        user,
        isInitialized: true,
        initError: null,
      })
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Auth initialization failed')
      console.error('Auth initialization failed:', authError)
      set({
        isInitialized: true,
        initError: authError,
      })
    }
  },

  signIn: (method) => signInWith(method),

  signUp: async (email: string, password: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase()
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        // Where the confirmation link lands, when confirmation is on. Unset
        // (no links site yet) means Supabase uses its Site URL instead.
        options: EMAIL_CONFIRMED_URL ? { emailRedirectTo: EMAIL_CONFIRMED_URL } : undefined,
      })
      if (error) throw error

      if (data.session) return 'signed-in'

      // Confirmation is on: no session until the link in the email is opened.
      awaitConfirmation(cleanEmail, password)
      return 'awaiting-confirmation'
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Sign up failed')
      throw authError
    }
  },

  signOut: async () => {
    // Nothing to sign out of
    if (!get().session) return

    try {
      // Before the session goes: removing this device's push row needs the JWT
      await unregisterPushBeforeSignOut()

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear any user-specific client state after sign out
      queryClient.clear()
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Sign out failed')
      throw authError
    }
  },

  deleteAccount: async () => {
    try {
      await deleteAuthUser()

      // The user no longer exists server-side, so only the local session
      // needs clearing — a global sign-out would be refused with 403.
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (signOutError) {
        console.warn('Failed to sign out after account deletion:', signOutError)
      }

      // The local push token is forgotten by the SIGNED_OUT that signOut emits
      // (src/features/notifications); the device row went with the user.
      queryClient.clear()

      set({ session: null, user: null })
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Account deletion failed')
      throw authError
    }
  },

  resetPassword: async (email: string) => {
    try {
      // The reset link lands on the links site's form when there is one;
      // otherwise Supabase falls back to the project's Site URL.
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        RESET_PASSWORD_URL ? { redirectTo: RESET_PASSWORD_URL } : undefined
      )
      if (error) throw error
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Password reset failed')
      throw authError
    }
  },

  updatePassword: async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Password update failed')
      throw authError
    }
  },
}))
