import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { Platform } from 'react-native'

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
  signInWithGoogle: () => Promise<void>
  signInWithApple: () => Promise<void>
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

  signInWithGoogle: async () => {
    set({ isLoading: true })

    try {
      // Dynamically import GoogleSignin to avoid crashing in Expo Go
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin')

      // Configure GoogleSignin (safe to call multiple times)
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID : undefined,
      })

      // Check for Play Services (Android) or just proceed (iOS)
      await GoogleSignin.hasPlayServices()

      // Trigger the native Google Sign-In flow
      const response = await GoogleSignin.signIn()

      if (!response.data?.idToken) {
        throw new Error('No ID token received from Google')
      }

      // Exchange the Google ID token for a Supabase session
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      })

      if (error) throw error

      const userId = data.user?.id ?? data.session?.user.id ?? get().user?.id
      if (userId) {
        await useNotificationStore.getState().registerAndSaveToken(userId)
      }
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Google sign in failed')
      throw authError
    } finally {
      set({ isLoading: false })
    }
  },

  signInWithApple: async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS')
    }

    set({ isLoading: true })

    try {
      const AppleAuthentication = await import('expo-apple-authentication')

      // Check if Apple Sign-In is available on this device
      const isAvailable = await AppleAuthentication.isAvailableAsync()
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device')
      }

      // Request credentials from Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      })

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple')
      }

      // Exchange the Apple identity token for a Supabase session
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      })

      if (error) throw error

      const userId = data.user?.id ?? data.session?.user.id ?? get().user?.id
      if (userId) {
        await useNotificationStore.getState().registerAndSaveToken(userId)
      }
    } catch (error) {
      // Handle user cancellation gracefully
      if (error && typeof error === 'object' && 'code' in error) {
        const appleError = error as { code: string }
        if (appleError.code === 'ERR_REQUEST_CANCELED') {
          throw new Error('Sign in was cancelled')
        }
      }
      const authError = error instanceof Error ? error : new Error('Apple sign in failed')
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
