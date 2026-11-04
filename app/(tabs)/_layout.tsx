import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

import { TabBar } from '@/src/components/navigation/TabBar'
import { useColors } from '@/src/hooks/useColors'

export default function TabLayout() {
  const colors = useColors()

  return (
    <Tabs
      // The tab bar is a glass pill floating over the content. Screens add
      // useTabBarPadding() to their scroll content so nothing hides under it.
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        // Home and Profile draw their own glass NavBar over the content; the
        // stock header is off for them.
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
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
