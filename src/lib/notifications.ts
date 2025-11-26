import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

import { supabase } from './supabase'

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()

  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  return finalStatus === 'granted'
}

/**
 * Get the Expo Push Token for this device
 * Returns null if unable to get token (not a physical device, no permissions, etc.)
 */
export async function getExpoPushToken(): Promise<string | null> {
  // Must be a physical device
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device')
    return null
  }

  // Get project ID from Expo config
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId

  if (!projectId) {
    console.error('Project ID not found in Expo config')
    return null
  }

  try {
    // On Android 13+, we need to create a notification channel first
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E6F4FE',
      })
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    })

    return token
  } catch (error) {
    console.error('Failed to get Expo push token:', error)
    return null
  }
}

/**
 * Register for push notifications - requests permissions and gets token
 * Returns the Expo Push Token or null if registration failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions()

  if (!hasPermission) {
    console.warn('Notification permissions not granted')
    return null
  }

  return getExpoPushToken()
}

/**
 * Save the push token to the user's fcm_tokens column in Supabase
 * This stores the most recent token (schema defines fcm_tokens as text)
 */
export async function savePushTokenToUser(userId: string, token: string): Promise<void> {
  const { error } = await supabase.from('users').update({ fcm_tokens: token }).eq('id', userId)

  if (error) {
    console.error('Failed to save push token:', error)
    throw error
  }
}

/**
 * Remove the push token from the user's fcm_tokens column in Supabase
 */
export async function removePushTokenFromUser(userId: string): Promise<void> {
  const { error } = await supabase.from('users').update({ fcm_tokens: null }).eq('id', userId)

  if (error) {
    console.error('Failed to remove push token:', error)
    throw error
  }
}

/**
 * Add a listener for incoming notifications while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback)
}

/**
 * Add a listener for when a user interacts with a notification
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback)
}
