import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/src/lib/supabase'
import type { User, UserUpdate } from '@/src/types/database'

export const userKeys = {
  all: ['users'] as const,
  profile: (userId: string) => [...userKeys.all, 'profile', userId] as const,
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.profile(userId ?? ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!userId,
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string
      updates: UserUpdate
    }) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(userKeys.profile(variables.userId), data)
    },
  })
}

// Re-export types for convenience
export type { User, UserUpdate }
