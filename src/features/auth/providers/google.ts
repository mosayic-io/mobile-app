import { Platform } from 'react-native'

import type { Credential } from './types'

export async function getGoogleCredential(): Promise<Credential> {
  // Loaded on demand: the native module must not load at startup or on web
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = await import(
    '@react-native-google-signin/google-signin'
  )

  // Safe to call more than once
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID : undefined,
  })

  try {
    // Play Services on Android; resolves straight away on iOS
    await GoogleSignin.hasPlayServices()

    const response = await GoogleSignin.signIn()
    if (isCancelledResponse(response)) return { kind: 'cancelled' }

    const { idToken, user } = response.data
    if (!idToken) throw new Error('No ID token received from Google')

    const name =
      user.name ?? [user.givenName, user.familyName].filter(Boolean).join(' ').trim()

    return {
      kind: 'id-token',
      provider: 'google',
      token: idToken,
      profile: {
        name: name && name.length > 0 ? name : null,
        photo: user.photo ?? null,
        email: user.email ?? null,
      },
    }
  } catch (error) {
    // Older Android flows reject on cancel instead of resolving 'cancelled'
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { kind: 'cancelled' }
    }
    throw error
  }
}
