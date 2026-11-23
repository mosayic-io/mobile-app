import { Platform } from 'react-native'

import type { Credential } from './types'

export async function getAppleCredential(): Promise<Credential> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS')
  }

  // Loaded on demand: the native module must not load at startup or on web
  const AppleAuthentication = await import('expo-apple-authentication')

  if (!(await AppleAuthentication.isAvailableAsync())) {
    throw new Error('Apple Sign-In is not available on this device')
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    })

    if (!credential.identityToken) {
      throw new Error('No identity token received from Apple')
    }

    return { kind: 'id-token', provider: 'apple', token: credential.identityToken }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
      return { kind: 'cancelled' }
    }
    throw error
  }
}
