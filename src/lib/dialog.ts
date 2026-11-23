// The phone adapter behind ./feedback: React Native's Alert. Import
// ./feedback, not this file. Its web twin is ./dialog.web.ts — keep the
// exports in step.
import { Alert } from 'react-native'

export type ConfirmOptions = {
  title: string
  message: string
  // The confirming button's label; defaults to "OK"
  confirmText?: string
  // Draws the confirming button in the platform's destructive style
  destructive?: boolean
}

// Tells the person something: a failure, or that an action worked.
export function notify(title: string, message: string): void {
  Alert.alert(title, message)
}

// Asks before an action. Resolves true only when the person confirms;
// Cancel, or dismissing the dialog (Android back / tap outside), is false.
export function confirm({
  title,
  message,
  confirmText = 'OK',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    )
  })
}
