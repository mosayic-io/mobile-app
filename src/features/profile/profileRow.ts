import { queryClient } from '@/src/lib/queryClient'
import { supabase } from '@/src/lib/supabase'
import type { User as ProfileRow, UserUpdate } from '@/src/types/database'

// The one place that reads and writes public.users. Writes are UPDATEs,
// never upserts: the row already exists (the on_auth_user_created trigger
// makes it at sign-up), and signed-in users have no INSERT on public.users,
// which an upsert needs even when the row is there ("permission denied for
// table users").

export type { ProfileRow }

/** What an identity provider (Google) says about the person. */
export type ProviderProfile = {
  name: string | null
  photo: string | null
  email: string | null
}

export const userKeys = {
  all: ['users'] as const,
  profile: (userId: string) => [...userKeys.all, 'profile', userId] as const,
}

export async function fetchProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateProfile(userId: string, updates: UserUpdate): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  queryClient.setQueryData(userKeys.profile(userId), data)
  return data
}

/** Trim; an empty name is stored as null ("Not set"). */
export function normaliseDisplayName(name: string): string | null {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed : null
}

// Copies what the provider knows (name, photo, email) onto the account after
// a provider sign-in: the auth metadata and the users row. Never throws — a
// failed write must not undo a successful sign-in.
export async function seedProfileFromProvider(
  userId: string,
  details: ProviderProfile
): Promise<void> {
  const { name, photo, email } = details

  try {
    if (name || photo) {
      await supabase.auth.updateUser({
        data: {
          full_name: name,
          avatar_url: photo,
        },
      })
    }

    const seed: UserUpdate = {}
    if (name) seed.display_name = name
    if (photo) seed.photo_url = photo
    if (email) seed.email = email

    if (Object.keys(seed).length > 0) {
      const { error } = await supabase.from('users').update(seed).eq('id', userId)
      if (error) throw error
    }
  } catch (seedError) {
    console.warn('Failed to seed the profile from the provider:', seedError)
  } finally {
    // The Profile screen may already have fetched the row before the seed
    // landed; refetch so it shows the provider's name and photo right away.
    void queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) })
  }
}
