import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { spacing } from '@/src/lib/theme'

// The tab bar is a pill that floats over the content, clear of the screen's
// bottom edge (src/components/navigation/TabBar.tsx). Screens under it add
// useTabBarPadding() to their scroll content's paddingBottom so the last
// item can scroll clear of it.
export const TAB_BAR_HEIGHT = 64

/** How far the floating bar sits above the bottom of the screen. */
export function useTabBarOffset(): number {
  const insets = useSafeAreaInsets()
  return Math.max(insets.bottom, spacing.md)
}

export function useTabBarPadding(): number {
  return TAB_BAR_HEIGHT + useTabBarOffset() + spacing.lg
}
