// Action feedback: how a screen reports a failure, confirms an action worked,
// or asks before doing something. React Native's Alert does nothing in a
// browser, so screens never call Alert.alert themselves — they call these,
// and the platform adapter (./dialog on a phone, ./dialog.web in the web
// build) shows a native alert or the browser's alert / confirm.
export { confirm, notify } from './dialog'
export type { ConfirmOptions } from './dialog'

const FALLBACK_MESSAGE = 'An unexpected error occurred'

// Turns whatever a catch block caught into a sentence for a person.
export function errorMessage(error: unknown, fallback: string = FALLBACK_MESSAGE): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}
