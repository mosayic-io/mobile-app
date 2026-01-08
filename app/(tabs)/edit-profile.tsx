import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'

import { Button, Input, Text } from '@/src/components/ui'
import { ScreenErrorBoundary } from '@/src/components/error'
import { useAuthStore } from '@/src/features/auth'
import { useUserProfile, useUpdateUserProfile } from '@/src/features/profile'
import { useColors } from '@/src/hooks/useColors'
import { borderRadius, spacing, type Colors } from '@/src/lib/theme'

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
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      gap: spacing.md,
      shadowColor: colors.text,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
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
  const { user, updatePassword, resetPassword, deleteAccount, isLoading } = useAuthStore()
  const { data: profile } = useUserProfile(user?.id)
  const updateProfile = useUpdateUserProfile()
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (profile?.display_name !== undefined && profile?.display_name !== null) {
      setDisplayName(profile.display_name)
    }
  }, [profile?.display_name])

  const handleSaveProfile = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Profile Update Failed', 'No authenticated user found.')
      return
    }

    const trimmedName = displayName.trim()

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        updates: {
          display_name: trimmedName.length > 0 ? trimmedName : null,
        },
      })
      Alert.alert('Profile Updated', 'Your display name has been updated.')
    } catch (error) {
      Alert.alert(
        'Profile Update Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }, [displayName, updateProfile, user?.id])

  const handleUpdatePassword = useCallback(async () => {
    if (!newPassword) {
      Alert.alert('Password Required', 'Enter a new password to continue.')
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Make sure both password fields match.')
      return
    }

    try {
      await updatePassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      Alert.alert('Password Updated', 'Your password has been updated.')
    } catch (error) {
      Alert.alert(
        'Password Update Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }, [confirmPassword, newPassword, updatePassword])

  const handleResetPassword = useCallback(async () => {
    if (!user?.email) {
      Alert.alert('Reset Failed', 'No email address found for this account.')
      return
    }

    try {
      await resetPassword(user.email)
      Alert.alert('Reset Email Sent', 'Check your inbox for a password reset link.')
    } catch (error) {
      Alert.alert(
        'Reset Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )
    }
  }, [resetPassword, user?.email])

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount()
            } catch (error) {
              Alert.alert(
                'Delete Account Failed',
                error instanceof Error ? error.message : 'An unexpected error occurred'
              )
            }
          },
        },
      ]
    )
  }, [deleteAccount])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityRole="scrollbar"
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h3" style={styles.sectionTitle}>
            Profile
          </Text>
          <Button
            onPress={handleSaveProfile}
            loading={updateProfile.isPending}
            size="sm"
            variant="outline"
            accessibilityLabel="Save display name"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save'}
          </Button>
        </View>
        <Input
          placeholder="Display name"
          accessibilityLabel="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h3" style={styles.sectionTitle}>
            Password
          </Text>
          <Button
            onPress={handleUpdatePassword}
            loading={isLoading}
            size="sm"
            variant="outline"
            accessibilityLabel="Update password"
          >
            {isLoading ? 'Updating...' : 'Update'}
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
      </View>

      <View style={[styles.section, styles.dangerSection]}>
        <Text variant="h3" style={[styles.sectionTitle, styles.dangerTitle]}>
          Danger Zone
        </Text>
        <Button
          onPress={handleDeleteAccount}
          variant="danger"
          loading={isLoading}
          size="md"
          accessibilityLabel="Delete your account"
        >
          {isLoading ? 'Deleting...' : 'Delete Account'}
        </Button>
      </View>
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
