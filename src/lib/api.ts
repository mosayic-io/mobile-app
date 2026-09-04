import { apiConfigured, readEnv } from '@/src/lib/env'
import { supabase } from '@/src/lib/supabase'

export const API_NOT_CONFIGURED_MESSAGE =
  "The API isn't configured yet — fill in EXPO_PUBLIC_API_URL in .env"

// Resolved on first request, not at import, so the app boots without a backend.
function getApiBaseUrl(): string {
  const url = readEnv(process.env.EXPO_PUBLIC_API_URL, 'apiUrl')

  if (!apiConfigured || !url) {
    throw new Error(API_NOT_CONFIGURED_MESSAGE)
  }

  return url.replace(/\/+$/, '')
}

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

export async function deleteAuthUser(): Promise<void> {
  const apiBaseUrl = getApiBaseUrl()
  const token = await getAccessToken()
  const response = await fetch(`${apiBaseUrl}/auth/users/me`, {
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
