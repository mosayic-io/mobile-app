import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { BlurView } from 'expo-blur'

import { useColors, useIsDark } from '@/src/hooks/useColors'
import { fontWeight } from '@/src/lib/theme'

export default function TabLayout() {
  const colors = useColors()
  const isDark = useIsDark()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondary,
        tabBarLabelStyle: { fontWeight: fontWeight.medium },
        // The tab bar floats over the content as a glass strip. Screens add
        // useTabBarPadding() to their scroll content so nothing hides under it.
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={40}
              tint={isDark ? 'dark' : 'light'}
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassTab }]} />
          </View>
        ),
        // Home and Profile draw a large title in their content and their own
        // glass NavBar once it scrolls away; the stock header is off for them.
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarAccessibilityLabel: 'Main navigation',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          headerShown: true,
          href: null,
        }}
      />
    </Tabs>
  )
}
