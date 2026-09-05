import { apiConfigured, readEnv } from '@/src/lib/env'
import { supabase } from '@/src/lib/supabase'

// ── Account deletion ────────────────────────────────────────────────────────
// A Postgres function in the -api repo's migrations, not an API call: Apple
// and Google require in-app account deletion, and this way it works the moment
// the database exists — before any server is deployed. The function deletes
// only the calling user (auth.uid() from the session token) and can't be
// pointed at anyone else.

/** Delete the signed-in user's account. */
export async function deleteAuthUser(): Promise<void> {
  const { error } = await supabase.rpc('delete_own_account')
  if (error) throw new Error(error.message)
}

// ── Python API ──────────────────────────────────────────────────────────────
// For everything beyond the database — AI features, email, background work.
// Only needed once EXPO_PUBLIC_API_URL points at a running API.

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

/**
 * Call a Python API endpoint as the signed-in user, e.g.
 * `apiFetch('/protected')` or `apiFetch('/things', { method: 'POST', body: JSON.stringify(thing) })`.
 * Resolves to the parsed JSON body; throws with the API's error message on a non-2xx.
 */
export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const apiBaseUrl = getApiBaseUrl()
  const token = await getAccessToken()
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
