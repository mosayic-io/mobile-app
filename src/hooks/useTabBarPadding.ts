import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { spacing } from '@/src/lib/theme'

// The tab bar floats over the content (position: 'absolute', so the glass
// has something to blur). Screens under it add this to their scroll
// content's paddingBottom so the last item can scroll clear of the bar.
const TAB_BAR_HEIGHT = 49

export function useTabBarPadding(): number {
  const insets = useSafeAreaInsets()
  return TAB_BAR_HEIGHT + insets.bottom + spacing.lg
}
