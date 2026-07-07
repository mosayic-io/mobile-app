import { Stack } from 'expo-router'

// Ensure the welcome screen is the entry point of the auth flow,
// even when deep-linking directly into another auth route.
export const unstable_settings = {
  initialRouteName: 'onboarding',
}

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="email-auth" />
    </Stack>
  )
}
