import { isPlaceholder, readEnv } from '@/src/lib/env'

/**
 * The links site — `links.<your domain>`, the small Astro site that carries
 * the app's deep-link proof files, the password-reset form and the
 * email-confirmed page. Set EXPO_PUBLIC_LINKS_URL once the site is live
 * (eas.json's production profile is where it matters most: the addresses
 * in Supabase's emails are built from it).
 *
 * Unset — a fresh project, or local development — is fine: the auth store
 * then sends no redirect of its own and Supabase falls back to the
 * project's Site URL, which is exactly right while everything is local.
 */
const raw = readEnv(process.env.EXPO_PUBLIC_LINKS_URL, 'linksUrl')

export const LINKS_URL: string | null = isPlaceholder(raw) ? null : raw!.replace(/\/+$/, '')

/** Where Supabase's sign-up confirmation email lands. */
export const EMAIL_CONFIRMED_URL = LINKS_URL ? `${LINKS_URL}/email-confirmed` : undefined

/** Where Supabase's password-reset email lands. */
export const RESET_PASSWORD_URL = LINKS_URL ? `${LINKS_URL}/reset-password` : undefined
