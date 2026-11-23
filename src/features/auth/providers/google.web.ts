import type { Credential } from './types'

// The web twin of ./google.ts. The Google sign-in library only has a free
// implementation for iOS and Android (its web build is sponsors-only and
// fails with a long library error), so in the web preview the button stays
// but explains itself instead. Phones use ./google.ts and are unaffected.
// Keep the export in step with ./google.ts.

const GOOGLE_WEB_PREVIEW_MESSAGE =
  'Google sign-in works in the app on your phone. In this preview, continue with email.'

export async function getGoogleCredential(): Promise<Credential> {
  throw new Error(GOOGLE_WEB_PREVIEW_MESSAGE)
}
