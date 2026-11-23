import { create } from 'zustand'
import { isAuthError } from '@supabase/supabase-js'

import { EMAIL_CONFIRMED_URL } from '@/src/lib/links'
import { supabase } from '@/src/lib/supabase'

import { signInWith } from './providers'

// An email sign-up waiting for its confirmation link — only ever reached when
// email confirmation is switched ON in Supabase (it ships off). The auth
// store's signUp starts it when no session comes back; the verify-email
// screen and the Android /email-confirmed app-link finish it.
//
// The password is held in memory only (never in the store, never on disk)
// until the address is confirmed, so the app can sign the person in without
// asking for it again. A cold start loses it, and then they sign in by hand.
let pendingPassword: string | null = null

// The email is reactive (the verify-email screen shows it); the password is not.
const usePendingEmailStore = create<{ email: string | null }>(() => ({ email: null }))

/** The address waiting for confirmation, or null when nothing is pending. */
export const usePendingConfirmationEmail = () => usePendingEmailStore((state) => state.email)

/** signed-in: done. not-yet: the link hasn't been opened. lost: nothing to sign in with (cold start, abandoned, or already done). */
export type ConfirmationOutcome = 'signed-in' | 'not-yet' | 'lost'

/** Called by signUp when Supabase returns no session. */
export function awaitConfirmation(email: string, password: string): void {
  pendingPassword = password
  usePendingEmailStore.setState({ email })
}

/** Signs in with the sign-up's password. Throws only on real failures. */
export async function tryCompleteConfirmation(): Promise<ConfirmationOutcome> {
  const email = usePendingEmailStore.getState().email
  const password = pendingPassword
  if (!email || !password) return 'lost'

  try {
    await signInWith({ provider: 'password', email, password })
  } catch (error) {
    if (isAuthError(error) && error.code === 'email_not_confirmed') return 'not-yet'
    throw error
  }
  abandonConfirmation()
  return 'signed-in'
}

/** Sends the confirmation email again, to the pending address. */
export async function resendConfirmation(): Promise<void> {
  const email = usePendingEmailStore.getState().email
  if (!email) throw new Error('There is no sign-up waiting for confirmation. Sign in instead.')

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    // Where the confirmation link lands. Unset (no links site yet) means
    // Supabase uses its Site URL instead.
    options: EMAIL_CONFIRMED_URL ? { emailRedirectTo: EMAIL_CONFIRMED_URL } : undefined,
  })
  if (error) throw error
}

/** Forgets the pending sign-up ("sign in another way"). */
export function abandonConfirmation(): void {
  pendingPassword = null
  usePendingEmailStore.setState({ email: null })
}
