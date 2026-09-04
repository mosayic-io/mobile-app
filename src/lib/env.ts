import Constants from 'expo-constants'

/**
 * Unconfigured mode
 *
 * A brand-new project has no Supabase yet, so the app still boots with the
 * `.env.example` placeholders (or no `.env` at all): the home tab and the
 * design preview render, and anything that needs a backend explains itself
 * at the moment it's used instead of crashing at import time. That way there
 * is something to look at before Supabase is set up. `backendConfigured` and
 * `apiConfigured` are how the rest of the app tells the two states apart.
 */

export function readEnv(envValue: string | undefined, extraKey: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined

  return (
    envValue ??
    // Allow falling back to values provided in app.json/app.config extra
    extra?.[extraKey]
  )
}

// `.env.example` marks every value to fill in with angle brackets, e.g.
// `<YOUR_SUPABASE_PUBLISHABLE_KEY>` — treat those the same as missing.
export function isPlaceholder(value: string | null | undefined): boolean {
  if (!value || value.trim().length === 0) return true
  return value.includes('<') || value.includes('>')
}

export function requireEnv(
  envValue: string | undefined,
  extraKey: string,
  envKey: string
): string {
  const value = readEnv(envValue, extraKey)

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${envKey}. Set ${envKey} in your environment or app.json extra.`
    )
  }

  return value
}

export const backendConfigured: boolean =
  !isPlaceholder(readEnv(process.env.EXPO_PUBLIC_SUPABASE_URL, 'supabaseUrl')) &&
  !isPlaceholder(readEnv(process.env.EXPO_PUBLIC_SUPABASE_PUB_KEY, 'supabaseAnonKey'))

export const apiConfigured: boolean = !isPlaceholder(
  readEnv(process.env.EXPO_PUBLIC_API_URL, 'apiUrl')
)
