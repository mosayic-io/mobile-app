import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { BlurView } from 'expo-blur'

import { useColors, useIsDark } from '@/src/hooks/useColors'

export default function TabLayout() {
  const colors = useColors()
  const isDark = useIsDark()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tertiary,
        // The tab bar floats over the content as a glass strip. Screens add
        // useTabBarPadding() to their scroll content so nothing hides under it.
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: colors.glassEdge,
          elevation: 0,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={isDark ? 30 : 45}
              tint={isDark ? 'dark' : 'light'}
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassFill }]} />
          </View>
        ),
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
          // The greeting is the title; the glow runs under the status bar.
          headerShown: false,
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
          href: null,
        }}
      />
    </Tabs>
  )
}
