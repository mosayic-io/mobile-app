import { AppState, type AppStateStatus } from 'react-native'
import { QueryClient, focusManager } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Ensure React Query refocuses queries when the app returns to the foreground
focusManager.setEventListener((handleFocus) => {
  const onAppStateChange = (status: AppStateStatus) => {
    handleFocus(status === 'active')
  }

  const subscription = AppState.addEventListener('change', onAppStateChange)
  return () => subscription.remove()
})
