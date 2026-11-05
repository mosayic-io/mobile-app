// The web build of ./notifications.ts. Push notifications are a phone
// feature, and importing expo-notifications in a browser registers a push
// token listener that only logs a warning, so on web nothing is imported and
// every call is a quiet no-op: permission reads as denied and there is never
// a token, so the notification store never prompts or saves anything.
//
// Metro picks this file over notifications.ts when it builds for web. Keep
// the exports in step with that file.
import type * as Notifications from 'expo-notifications'

const noSubscription: Notifications.EventSubscription = { remove: () => {} }

export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  return 'denied' as Notifications.PermissionStatus
}

export async function requestNotificationPermissions(): Promise<boolean> {
  return false
}

export async function getExpoPushToken(): Promise<string | null> {
  return null
}

export async function registerForPushNotifications(): Promise<string | null> {
  return null
}

export async function savePushTokenToDevice(_userId: string, _token: string): Promise<void> {}

export async function removePushTokenFromDevice(_userId: string, _token: string): Promise<void> {}

export function addPushTokenChangeListener(_callback: () => void): Notifications.EventSubscription {
  return noSubscription
}

export function addNotificationReceivedListener(
  _callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return noSubscription
}

export function addNotificationResponseListener(
  _callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return noSubscription
}
