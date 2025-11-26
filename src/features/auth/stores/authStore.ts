import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '@/src/lib/supabase'
import { queryClient } from '@/src/lib/queryClient'
import { useNotificationStore } from '@/src/stores/notificationStore'

type AuthState = {
  session: Session | null
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  initError: Error | null
}

type AuthActions = {
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  setupAuthListener: () => () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  isLoading: false,
  isInitialized: false,
  initError: null,

  setupAuthListener: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      })

      // Ensure push token stays in sync when auth state changes
      if (session?.user?.id) {
        void useNotificationStore.getState().ensureToken(session.user.id)
      }
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

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      const session = data.session
      const user = session?.user ?? null

      set({
        session: data.session,
        user,
        isInitialized: true,
        initError: null,
      })

      // Ensure push token is registered for returning users (cold start)
      if (session?.user?.id) {
        void useNotificationStore.getState().ensureToken(session.user.id)
      }
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Auth initialization failed')
      console.error('Auth initialization failed:', authError)
      set({
        isInitialized: true,
        initError: authError,
      })
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const userId = data.user?.id ?? data.session?.user.id ?? get().user?.id
      if (userId) {
        await useNotificationStore.getState().registerAndSaveToken(userId)
      }
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Sign in failed')
      throw authError
    } finally {
      set({ isLoading: false })
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true })

    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      const userId = data.user?.id ?? data.session?.user.id ?? get().user?.id
      if (userId) {
        await useNotificationStore.getState().registerAndSaveToken(userId)
      }
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Sign up failed')
      throw authError
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    set({ isLoading: true })

    try {
      const userId = get().user?.id

      if (userId) {
        await useNotificationStore.getState().removeToken(userId)
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      useNotificationStore.getState().clearToken()

      // Clear any user-specific client state after sign out
      queryClient.clear()
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Sign out failed')
      throw authError
    } finally {
      set({ isLoading: false })
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true })

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Password reset failed')
      throw authError
    } finally {
      set({ isLoading: false })
    }
  },

  updatePassword: async (password: string) => {
    set({ isLoading: true })

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Password update failed')
      throw authError
    } finally {
      set({ isLoading: false })
    }
  },
}))
