import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { Button, Card, Input, Text } from '@/src/components/ui'
import { ScreenErrorBoundary } from '@/src/components/error'
import { useAuthStore } from '@/src/features/auth'
import { useProfile } from '@/src/features/profile'
import { useColors } from '@/src/hooks/useColors'
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding'
import { confirm, errorMessage, notify } from '@/src/lib/feedback'
import { spacing, type Colors } from '@/src/lib/theme'

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.xl,
    },
    section: {
      gap: spacing.md,
    },
    sectionTitle: {
      marginBottom: spacing.xs,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    sectionFooter: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    dangerSection: {
      borderColor: colors.danger,
    },
    dangerTitle: {
      color: colors.danger,
    },
  })

function EditProfileScreen() {
  const { user, updatePassword, resetPassword, deleteAccount } = useAuthStore()
  // Each action tracks its own pending state, so one button's label never
  // changes because another was pressed
  const passwordUpdate = useMutation({ mutationFn: updatePassword })
  const accountDeletion = useMutation({ mutationFn: deleteAccount })
  const { profile, rename, isRenaming } = useProfile(user)
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const tabBarPadding = useTabBarPadding()
  const router = useRouter()

  // This screen only makes sense signed in (it's hidden from the tab bar)
  useEffect(() => {
    if (!user) {
      router.replace('/(tabs)/profile')
    }
  }, [router, user])

  // null means "not edited yet" — fall back to the profile value once it loads
  const [displayNameInput, setDisplayNameInput] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const displayName = displayNameInput ?? profile?.display_name ?? ''

  const handleSaveProfile = async () => {
    try {
      await rename(displayName)
      notify('Profile Updated', 'Your display name has been updated.')
    } catch (error) {
      notify('Profile Update Failed', errorMessage(error))
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      notify('Password Required', 'Enter a new password to continue.')
      return
    }

    if (newPassword !== confirmPassword) {
      notify('Passwords Do Not Match', 'Make sure both password fields match.')
      return
    }

    try {
      await passwordUpdate.mutateAsync(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      notify('Password Updated', 'Your password has been updated.')
    } catch (error) {
      notify('Password Update Failed', errorMessage(error))
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) {
      notify('Reset Failed', 'No email address found for this account.')
      return
    }

    try {
      await resetPassword(user.email)
      notify('Reset Email Sent', 'Check your inbox for a password reset link.')
    } catch (error) {
      notify('Reset Failed', errorMessage(error))
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: 'Delete Account',
      message:
        'This will permanently delete your account and all associated data. This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    })
    if (!confirmed) return

    try {
      await accountDeletion.mutateAsync()
    } catch (error) {
      notify('Delete Account Failed', errorMessage(error))
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding }]}
    >
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h3" style={styles.sectionTitle}>
            Profile
          </Text>
          <Button
            onPress={handleSaveProfile}
            loading={isRenaming}
            size="sm"
            variant="outline"
            accessibilityLabel="Save display name"
          >
            {isRenaming ? 'Saving...' : 'Save'}
          </Button>
        </View>
        <Input
          placeholder="Display name"
          accessibilityLabel="Display name"
          value={displayName}
          onChangeText={setDisplayNameInput}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h3" style={styles.sectionTitle}>
            Password
          </Text>
          <Button
            onPress={handleUpdatePassword}
            loading={passwordUpdate.isPending}
            size="sm"
            variant="outline"
            accessibilityLabel="Update password"
          >
            {passwordUpdate.isPending ? 'Updating...' : 'Update'}
          </Button>
        </View>
        <Input
          placeholder="New password"
          accessibilityLabel="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          textContentType="newPassword"
        />
        <Input
          placeholder="Confirm password"
          accessibilityLabel="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
        />
        <View style={styles.sectionFooter}>
          <Button
            onPress={handleResetPassword}
            variant="ghost"
            size="sm"
            accessibilityLabel="Send password reset email"
          >
            Send reset email
          </Button>
        </View>
      </Card>

      <Card style={[styles.section, styles.dangerSection]}>
        <Text variant="h3" style={[styles.sectionTitle, styles.dangerTitle]}>
          Danger Zone
        </Text>
        <Button
          onPress={handleDeleteAccount}
          variant="danger"
          loading={accountDeletion.isPending}
          size="md"
          accessibilityLabel="Delete your account"
        >
          {accountDeletion.isPending ? 'Deleting...' : 'Delete Account'}
        </Button>
      </Card>
    </ScrollView>
  )
}

export default function EditProfile() {
  return (
    <ScreenErrorBoundary screenName="Edit Profile">
      <EditProfileScreen />
    </ScreenErrorBoundary>
  )
}
