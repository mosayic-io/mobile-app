import { Stack, useRouter } from 'expo-router'
import { useEffect } from 'react'

import { useAuthStore } from '@/src/features/auth'

// The auth flow is entered from Profile → "Sign in". Make sign-in its entry
// point even when deep-linking directly into another auth route.
export const unstable_settings = {
  initialRouteName: 'sign-in',
}

export default function AuthLayout() {
  const session = useAuthStore((state) => state.session)
  const router = useRouter()

  // Once signed in there is nothing left to do here — hand back to Profile.
  useEffect(() => {
    if (session) {
      router.replace('/(tabs)/profile')
    }
  }, [router, session])

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="email-auth" />
    </Stack>
  )
}
