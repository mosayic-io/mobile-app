import type { ProviderProfile } from '@/src/features/profile'

// The seam between the sign-in methods and Supabase. Each adapter talks to
// one identity provider and hands back a Credential; signInWith (./index.ts)
// exchanges it for a Supabase session. Adding a provider means adding an
// adapter here, not another action on the auth store.

export type SignInMethod =
  | { provider: 'google' }
  | { provider: 'apple' }
  | { provider: 'password'; email: string; password: string }

/** Cancelling the provider's own sheet is an outcome, not an error. */
export type SignInOutcome = 'signed-in' | 'cancelled'

/** What Google says about the person, seeded into their profile after sign-in. */
export type GoogleProfileDetails = ProviderProfile

export type Credential =
  | { kind: 'cancelled' }
  | { kind: 'password'; email: string; password: string }
  | { kind: 'id-token'; provider: 'apple'; token: string }
  | { kind: 'id-token'; provider: 'google'; token: string; profile: GoogleProfileDetails }
