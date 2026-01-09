import Constants from 'expo-constants'

import { supabase } from '@/src/lib/supabase'

function readEnv(envValue: string | undefined, extraKey: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined

  return (
    envValue ??
    // Allow falling back to values provided in app.json/app.config extra
    extra?.[extraKey]
  )
}

function requireEnv(envValue: string | undefined, extraKey: string, envKey: string): string {
  const value = readEnv(envValue, extraKey)

  if (!value) {
    const hint = `Set ${envKey} in your environment or app.json extra.`
    throw new Error(`Missing required environment variable: ${envKey}. ${hint}`)
  }

  return value.replace(/\/+$/, '')
}

const apiBaseUrl = requireEnv(process.env.EXPO_PUBLIC_API_URL, 'apiUrl', 'EXPO_PUBLIC_API_URL')

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const token = data.session?.access_token
  if (!token) throw new Error('No active session found')
  return token
}

async function parseErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}`

  try {
    const text = await response.text()
    if (!text) return fallback

    try {
      const json = JSON.parse(text) as { detail?: string; message?: string }
      return json.detail ?? json.message ?? text
    } catch {
      return text
    }
  } catch {
    return fallback
  }
}

export async function deleteAuthUser(userId: string): Promise<void> {
  const token = await getAccessToken()
  const response = await fetch(`${apiBaseUrl}/auth/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message)
  }
}
