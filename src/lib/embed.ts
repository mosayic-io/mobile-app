import { useEffect } from 'react'
import { Platform } from 'react-native'
import type { EdgeInsets } from 'react-native-safe-area-context'

import { useColors, useIsDark } from '@/src/hooks/useColors'

// The web build inside a phone-shaped frame (the Mosayic dashboard's
// preview, or any iframe that wants to look like a device). Two small
// courtesies, both no-ops everywhere else:
//
// 1. `?insets=<top>,<bottom>` on the page URL becomes the app's safe-area
//    insets, since an iframe reports none — so the app draws edge to edge
//    under the frame's status bar and home indicator, as it would on a phone.
// 2. The colour scheme and background are posted to the parent window, so
//    the frame can paint its status-bar text to match.

function readEmbedInsets(): EdgeInsets | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('insets')
  if (!raw) return null
  const [top = 0, bottom = 0, left = 0, right = 0] = raw.split(',').map((n) => Number(n) || 0)
  return { top, bottom, left, right }
}

export const embedInsets: EdgeInsets | null = readEmbedInsets()

export const isEmbedded: boolean =
  Platform.OS === 'web' && typeof window !== 'undefined' && window.parent !== window

/** Tells the embedding frame which colour scheme the app is showing. */
export function useEmbedThemeBridge(): void {
  const isDark = useIsDark()
  const colors = useColors()

  useEffect(() => {
    if (!isEmbedded) return
    window.parent.postMessage(
      { type: 'app-theme', dark: isDark, background: colors.background },
      '*'
    )
  }, [colors.background, isDark])
}
