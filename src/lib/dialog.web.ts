// The web build of ./dialog.ts. React Native's Alert is a no-op in a
// browser, so the browser's own alert and confirm stand in. During static
// rendering there is no window: notify does nothing and confirm says no.
//
// Metro picks this file over dialog.ts when it builds for web. Keep the
// exports in step with that file.
import type { ConfirmOptions } from './dialog'

export type { ConfirmOptions }

export function notify(title: string, message: string): void {
  if (typeof window === 'undefined') return
  window.alert(`${title}\n\n${message}`)
}

export function confirm({ title, message }: ConfirmOptions): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  return Promise.resolve(window.confirm(`${title}\n\n${message}`))
}
