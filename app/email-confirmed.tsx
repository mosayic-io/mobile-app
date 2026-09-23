import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'

import { useAuthStore } from '@/src/features/auth'

// The confirmation email lands on links.<your domain>/email-confirmed. Android
// claims the whole links host, so that link can open the app here instead of
// the browser. Outside the (auth) group so it is reachable signed out: it
// finishes the sign-up's sign-in if it can (the auth store still holds the
// password from this launch) and then goes to Profile — signed in, or ready
// to sign in by hand.
export default function EmailConfirmedLink() {
  const completeVerification = useAuthStore((state) => state.completeVerification)
  const [done, setDone] = useState(false)

  useEffect(() => {
    completeVerification()
      .catch(() => false)
      .finally(() => setDone(true))
  }, [completeVerification])

  return done ? <Redirect href="/(tabs)/profile" /> : null
}
