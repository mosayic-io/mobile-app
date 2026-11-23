import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'

import { tryCompleteConfirmation } from '@/src/features/auth'

// The confirmation email lands on links.<your domain>/email-confirmed. Android
// claims the whole links host, so that link can open the app here instead of
// the browser. Outside the (auth) group so it is reachable signed out: it
// finishes the sign-up's sign-in if it can (src/features/auth/pendingConfirmation.ts
// still holds the password from this launch) and then goes to Profile — signed in, or ready
// to sign in by hand.
export default function EmailConfirmedLink() {
  const [done, setDone] = useState(false)

  // Whatever the outcome ('signed-in', 'not-yet', 'lost' or a failure),
  // Profile is the right place to land next.
  useEffect(() => {
    tryCompleteConfirmation()
      .catch(() => 'lost')
      .finally(() => setDone(true))
  }, [])

  return done ? <Redirect href="/(tabs)/profile" /> : null
}
