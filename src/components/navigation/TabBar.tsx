import { useMemo, type ComponentProps } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { BlurView } from 'expo-blur'
import { Tabs } from 'expo-router'

import { Text } from '@/src/components/ui'
import { useColors, useIsDark } from '@/src/hooks/useColors'
import { TAB_BAR_HEIGHT, useTabBarOffset } from '@/src/hooks/useTabBarPadding'
import { borderRadius, type Colors } from '@/src/lib/theme'

// The tab bar: a glass pill floating over the content, the selected tab on a
// soft pill of its own. Pass it to <Tabs tabBar={…}>; each screen's
// `tabBarIcon` and `title` draw its item, and a screen with `href: null`
// stays out of it.

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0]

const ITEM_WIDTH = 92
const INSET = 6

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    bar: {
      flexDirection: 'row',
      height: TAB_BAR_HEIGHT,
      padding: INSET,
      borderRadius: borderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    shadow: {
      borderRadius: borderRadius.full,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    item: {
      width: ITEM_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      borderRadius: borderRadius.full,
    },
    itemSelected: {
      backgroundColor: colors.segmentTrack,
    },
  })

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const colors = useColors()
  const isDark = useIsDark()
  const offset = useTabBarOffset()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={[styles.wrap, { bottom: offset }]} pointerEvents="box-none">
      <View style={styles.shadow}>
        <View style={styles.bar} accessibilityRole="tablist">
          <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassTab }]} />
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key]
            // `href: null` hides a screen from the bar.
            if (StyleSheet.flatten(options.tabBarItemStyle)?.display === 'none') return null

            const focused = state.index === index
            const color = focused ? colors.text : colors.secondary
            const label = options.title ?? route.name

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params)
              }
            }

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                style={[styles.item, focused && styles.itemSelected]}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              >
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                <Text variant="caption" weight={focused ? 'semibold' : 'medium'} style={{ color }}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}
