import { useMutation, useQuery } from '@tanstack/react-query'
import type { User as AuthUser } from '@supabase/supabase-js'

import {
  fetchProfile,
  normaliseDisplayName,
  updateProfile,
  userKeys,
  type ProfileRow,
} from '../profileRow'

// Takes the auth user rather than reading the auth store: auth's sign-in
// calls into this module (seedProfileFromProvider), so importing the store
// here would make a cycle.
export function useProfile(user: AuthUser | null | undefined) {
  const userId = user?.id

  const query = useQuery({
    queryKey: userKeys.profile(userId ?? ''),
    queryFn: () => fetchProfile(userId as string),
    enabled: !!userId,
  })

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error('No authenticated user found.')
      await updateProfile(userId, { display_name: normaliseDisplayName(name) })
    },
  })

  const profile: ProfileRow | undefined = query.data

  return {
    profile,
    /** The saved name, else the email's local part, else null. */
    displayName: profile?.display_name ?? user?.email?.split('@')[0] ?? null,
    isLoading: query.isLoading,
    error: query.error,
    rename: renameMutation.mutateAsync,
    isRenaming: renameMutation.isPending,
  }
}
