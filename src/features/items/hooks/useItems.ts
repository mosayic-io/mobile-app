import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/src/lib/supabase'
import type { Item, ItemInsert, ItemUpdate } from '@/src/types/database'

export const itemKeys = {
  all: ['items'] as const,
  list: (userId: string) => [...itemKeys.all, 'list', userId] as const,
  detail: (id: string) => [...itemKeys.all, 'detail', id] as const,
}

export function useItems(userId: string | undefined) {
  return useQuery({
    queryKey: itemKeys.list(userId ?? ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .order('name')

      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!userId,
  })
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: itemKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Item ID is required')

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: ItemInsert) => {
      const { data, error } = await supabase
        .from('items')
        .insert(item)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ItemUpdate }) => {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(itemKeys.detail(variables.id), data)
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('items').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
    },
  })
}

// Re-export types for convenience
export type { Item, ItemInsert, ItemUpdate }
