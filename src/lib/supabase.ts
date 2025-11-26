import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { createClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

import type { Database } from '@/src/types/database'

type EnvKey = 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_PUB_KEY'

function readEnv(key: EnvKey, extraKey: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined

  return (
    process.env[key] ??
    // Allow falling back to values provided in app.json/app.config extra
    extra?.[extraKey]
  )
}

function requireEnv(key: EnvKey, extraKey: string): string {
  const value = readEnv(key, extraKey)

  if (!value) {
    const hint =
      'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUB_KEY in your environment or app.json extra.'
    throw new Error(`Missing required environment variable: ${key}. ${hint}`)
  }

  return value
}

const supabaseUrl = requireEnv('EXPO_PUBLIC_SUPABASE_URL', 'supabaseUrl')
const supabaseAnonKey = requireEnv('EXPO_PUBLIC_SUPABASE_PUB_KEY', 'supabaseAnonKey')

type SupabaseClientType = ReturnType<typeof createClient<Database>>

// Lazy initialization to avoid TurboModule timing issues on iOS
let _supabase: SupabaseClientType | null = null
let _appStateListenerRegistered = false

function getSupabase(): SupabaseClientType {
  if (!_supabase) {
    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })

    // Register AppState listener only once, after client is created
    if (Platform.OS !== 'web' && !_appStateListenerRegistered) {
      _appStateListenerRegistered = true
      AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          _supabase?.auth.startAutoRefresh()
        } else {
          _supabase?.auth.stopAutoRefresh()
        }
      })
    }
  }
  return _supabase
}

// Proxy provides lazy initialization while maintaining the same API
export const supabase = new Proxy({} as SupabaseClientType, {
  get(_target, prop: string | symbol) {
    const client = getSupabase()
    const value = client[prop as keyof SupabaseClientType]
    // Bind methods to the client instance
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})
