import { seedProfileFromProvider } from '@/src/features/profile'
import { supabase } from '@/src/lib/supabase'

import { getAppleCredential } from './apple'
import { getGoogleCredential } from './google'
import type { Credential, SignInMethod, SignInOutcome } from './types'

export type { SignInMethod, SignInOutcome } from './types'

const FAILURE_MESSAGE: Record<SignInMethod['provider'], string> = {
  google: 'Google sign in failed',
  apple: 'Apple sign in failed',
  password: 'Sign in failed',
}

function getCredential(method: SignInMethod): Promise<Credential> {
  switch (method.provider) {
    case 'google':
      return getGoogleCredential()
    case 'apple':
      return getAppleCredential()
    case 'password':
      return Promise.resolve({ kind: 'password', email: method.email, password: method.password })
  }
}

// The shared tail: credential → Supabase session. Throws only for real
// failures, always as an Error with a message a person can read.
export async function signInWith(method: SignInMethod): Promise<SignInOutcome> {
  try {
    const credential = await getCredential(method)
    if (credential.kind === 'cancelled') return 'cancelled'

    if (credential.kind === 'password') {
      const { error } = await supabase.auth.signInWithPassword({
        email: credential.email,
        password: credential.password,
      })
      if (error) throw error
      return 'signed-in'
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: credential.provider,
      token: credential.token,
    })
    if (error) throw error

    // Hand-off to the profile module, which owns the public.users row
    if (credential.provider === 'google' && data.user) {
      await seedProfileFromProvider(data.user.id, {
        ...credential.profile,
        email: credential.profile.email ?? data.user.email ?? null,
      })
    }

    return 'signed-in'
  } catch (error) {
    throw error instanceof Error ? error : new Error(FAILURE_MESSAGE[method.provider])
  }
}
