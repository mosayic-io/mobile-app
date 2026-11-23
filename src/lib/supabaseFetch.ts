import { Platform } from 'react-native'

// The fetch the Supabase client uses. Sign-in, sign-up and the other auth
// calls (`/auth/v1/…`) get a time limit and a plain message when Supabase
// can't be reached. Without it, a Supabase that isn't running — or a stale
// address in .env, like a laptop's old Wi-Fi IP — makes the request wait on
// the operating system's own timeout, which can be more than a minute, and
// the screen looks frozen.
//
// Everything else (database queries, file uploads) goes through untouched,
// so a large upload is never cut short. Auth calls answer in well under a
// second when Supabase is up, so the limit never changes a working app.

export const AUTH_TIMEOUT_MS = 15_000

// What the person sees when an auth call gets no answer. The hint about
// Claude Code is for whoever is building the app, so it only appears in
// the web build — the preview people build in, like the Google sign-in note
// (auth/providers/google.web.ts). The app on a phone, whose users are
// usually just offline, gets an ordinary message.
export const SUPABASE_UNREACHABLE_PREVIEW_MESSAGE =
  "Can't reach Supabase right now. If you're building locally, ask Claude Code to check that Supabase is running."
export const SUPABASE_UNREACHABLE_MESSAGE =
  "Can't connect right now. Check your internet connection and try again."

export function unreachableMessage(isWeb: boolean = Platform.OS === 'web'): string {
  return isWeb ? SUPABASE_UNREACHABLE_PREVIEW_MESSAGE : SUPABASE_UNREACHABLE_MESSAGE
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

export function createSupabaseFetch(baseFetch: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    if (!urlOf(input).includes('/auth/v1/')) return baseFetch(input, init)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS)
    // A caller's own cancel still cancels.
    const callerSignal = init?.signal
    const forwardAbort = () => controller.abort()
    callerSignal?.addEventListener('abort', forwardAbort)

    try {
      return await baseFetch(input, { ...init, signal: controller.signal })
    } catch (error) {
      // Cancelled by the caller: theirs to handle, not an outage.
      if (callerSignal?.aborted) throw error
      // Timed out, refused, no network: the request never got an answer.
      throw new Error(unreachableMessage())
    } finally {
      clearTimeout(timer)
      callerSignal?.removeEventListener('abort', forwardAbort)
    }
  }
}
