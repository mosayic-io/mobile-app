import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'

import { Avatar, Button, Text } from '@/src/components/ui'
import { useColors } from '@/src/hooks/useColors'
import { spacing, borderRadius, type Colors, type ThemeMode } from '@/src/lib/theme'
import { useAuthStore } from '@/src/features/auth'
import { useUserProfile } from '@/src/features/profile'
import { useThemeStore } from '@/src/stores/themeStore'
import { ScreenErrorBoundary } from '@/src/components/error'

const themeModeLabels: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

const themeModes: ThemeMode[] = ['light', 'dark', 'system']

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    header: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    userName: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    userEmail: {
      marginBottom: spacing.md,
    },
    section: {
      marginTop: spacing.sm,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    menuItemIcon: {
      marginRight: spacing.md,
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemValue: {
      marginRight: spacing.sm,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    themeOption: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    themeOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    logoutSection: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
  })

function ProfileScreen() {
  const { user, signOut, isLoading } = useAuthStore()
  const router = useRouter()
  const { mode, setMode } = useThemeStore()
  const [showThemePicker, setShowThemePicker] = useState(false)
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { data: profile } = useUserProfile(user?.id)

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      Alert.alert(
        'Sign Out Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }, [signOut])

  const handleThemeChange = useCallback(
    (themeMode: ThemeMode) => {
      setMode(themeMode)
    },
    [setMode]
  )

  const displayName = profile?.display_name ?? user?.email?.split('@')[0] ?? 'User'

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      accessibilityRole="scrollbar"
    >
      <View style={styles.header}>
        <Avatar
          name={user?.email}
          size="xl"
        />
        <Text variant="h3" style={styles.userName}>
          {displayName}
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.userEmail}>
          {user?.email}
        </Text>
      </View>

      <View style={styles.section}>
        <Pressable
          style={styles.menuItem}
          onPress={() => router.push('/(tabs)/edit-profile')}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          accessibilityHint="Double tap to edit your profile settings"
        >
          <Ionicons
            name="create-outline"
            size={22}
            color={colors.text}
            style={styles.menuItemIcon}
          />
          <Text variant="body" style={styles.menuItemContent}>
            Edit Profile
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.tertiary} />
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => setShowThemePicker(!showThemePicker)}
          accessibilityRole="button"
          accessibilityLabel={`Display theme: ${themeModeLabels[mode]}`}
          accessibilityHint="Double tap to change display theme"
          accessibilityState={{ expanded: showThemePicker }}
        >
          <Ionicons
            name="contrast-outline"
            size={22}
            color={colors.text}
            style={styles.menuItemIcon}
          />
          <Text variant="body" style={styles.menuItemContent}>
            Display
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.menuItemValue}>
            {themeModeLabels[mode]}
          </Text>
          <Ionicons
            name={showThemePicker ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.tertiary}
          />
        </Pressable>

        {showThemePicker && (
          <View
            style={styles.themeOptions}
            accessibilityRole="radiogroup"
            accessibilityLabel="Theme options"
          >
            {themeModes.map((themeMode) => {
              const isActive = mode === themeMode
              return (
                <Pressable
                  key={themeMode}
                  style={[styles.themeOption, isActive && styles.themeOptionActive]}
                  onPress={() => handleThemeChange(themeMode)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                  accessibilityLabel={`${themeModeLabels[themeMode]} theme`}
                >
                  <Text
                    variant="bodySmall"
                    weight="medium"
                    style={{ color: isActive ? colors.background : colors.text }}
                  >
                    {themeModeLabels[themeMode]}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        )}
      </View>

      <View style={styles.logoutSection}>
        <Button
          onPress={handleSignOut}
          variant="outline"
          loading={isLoading}
          fullWidth
          accessibilityLabel="Log out of your account"
          accessibilityHint="Double tap to sign out"
        >
          {isLoading ? 'Logging out...' : 'Log Out'}
        </Button>
      </View>

      <View style={styles.footer}>
        <Text variant="caption" color="tertiary">
          App Version {Constants.expoConfig?.version}
        </Text>
      </View>
    </ScrollView>
  )
}

export default function Profile() {
  return (
    <ScreenErrorBoundary screenName="Profile">
      <ProfileScreen />
    </ScreenErrorBoundary>
  )
}
