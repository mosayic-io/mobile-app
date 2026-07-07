import Constants from 'expo-constants'

function readEnv(envValue: string | undefined, extraKey: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined

  return (
    envValue ??
    // Allow falling back to values provided in app.json/app.config extra
    extra?.[extraKey]
  )
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
