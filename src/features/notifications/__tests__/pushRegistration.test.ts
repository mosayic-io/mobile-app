import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

// Each test loads a fresh copy of the module: it keeps the signed-in user and
// the in-flight registration in module state.
type PushModule = typeof import('../pushRegistration')
type NotificationsMock = {
  getNotificationPermissionStatus: jest.Mock
  requestNotificationPermissions: jest.Mock
  getExpoPushToken: jest.Mock
  savePushTokenToDevice: jest.Mock
  removePushTokenFromDevice: jest.Mock
  addPushTokenChangeListener: jest.Mock
}

let push: PushModule
let notifications: NotificationsMock
let emitAuth: (event: AuthChangeEvent, userId: string | null) => Promise<void>

const session = (userId: string) => ({ user: { id: userId } }) as Session

beforeEach(() => {
  jest.resetModules()
  jest.useFakeTimers()

  jest.doMock('@/src/lib/env', () => ({ backendConfigured: true }))
  jest.doMock('@/src/lib/notifications', () => ({
    getNotificationPermissionStatus: jest.fn().mockResolvedValue('granted'),
    requestNotificationPermissions: jest.fn().mockResolvedValue(true),
    getExpoPushToken: jest.fn().mockResolvedValue('token-1'),
    savePushTokenToDevice: jest.fn().mockResolvedValue(undefined),
    removePushTokenFromDevice: jest.fn().mockResolvedValue(undefined),
    addPushTokenChangeListener: jest.fn(() => ({ remove: jest.fn() })),
  }))

  let listener: (event: AuthChangeEvent, session: Session | null) => void = () => {}
  jest.doMock('@/src/lib/supabase', () => ({
    supabase: {
      auth: {
        onAuthStateChange: jest.fn((callback) => {
          listener = callback
          return { data: { subscription: { unsubscribe: jest.fn() } } }
        }),
      },
    },
  }))

  push = jest.requireActual<PushModule>('../pushRegistration')
  notifications = jest.requireMock<NotificationsMock>('@/src/lib/notifications')
  push.startPushSync()

  // The module defers auth events with setTimeout(0); run that, then let the
  // registration's promises settle.
  emitAuth = async (event, userId) => {
    listener(event, userId ? session(userId) : null)
    await jest.runAllTimersAsync()
  }
})

afterEach(() => {
  jest.useRealTimers()
})

it('ignores events before INITIAL_SESSION', async () => {
  await emitAuth('SIGNED_IN', 'user-1')
  expect(notifications.savePushTokenToDevice).not.toHaveBeenCalled()
})

it('re-saves the token for a restored session without prompting', async () => {
  notifications.getNotificationPermissionStatus.mockResolvedValue('denied')

  await emitAuth('INITIAL_SESSION', 'user-1')

  expect(notifications.requestNotificationPermissions).not.toHaveBeenCalled()
  expect(notifications.savePushTokenToDevice).not.toHaveBeenCalled()
})

it('asks for permission after a fresh sign-in, then saves the token', async () => {
  notifications.getNotificationPermissionStatus.mockResolvedValue('denied')

  await emitAuth('INITIAL_SESSION', null)
  await emitAuth('SIGNED_IN', 'user-1')

  expect(notifications.requestNotificationPermissions).toHaveBeenCalledTimes(1)
  expect(notifications.savePushTokenToDevice).toHaveBeenCalledWith('user-1', 'token-1')
})

it('treats SIGNED_IN for the user already signed in as a recovery, not a sign-in', async () => {
  notifications.getNotificationPermissionStatus.mockResolvedValue('denied')

  await emitAuth('INITIAL_SESSION', 'user-1')
  await emitAuth('SIGNED_IN', 'user-1')

  expect(notifications.requestNotificationPermissions).not.toHaveBeenCalled()
})

it('drops the old row when the OS replaced the token', async () => {
  await emitAuth('INITIAL_SESSION', 'user-1')
  notifications.getExpoPushToken.mockResolvedValue('token-2')
  await emitAuth('TOKEN_REFRESHED', 'user-1')

  expect(notifications.removePushTokenFromDevice).toHaveBeenCalledWith('user-1', 'token-1')
  expect(notifications.savePushTokenToDevice).toHaveBeenLastCalledWith('user-1', 'token-2')
})

it('on sign-out waits for a registration in flight, then removes the row', async () => {
  await emitAuth('INITIAL_SESSION', 'user-1')

  // A token refresh starts a registration that is still waiting on Expo…
  let releaseToken!: (token: string) => void
  notifications.getExpoPushToken.mockReturnValueOnce(new Promise((resolve) => (releaseToken = resolve)))
  await emitAuth('TOKEN_REFRESHED', 'user-1')

  // …when sign-out starts.
  const signOut = push.unregisterPushBeforeSignOut()
  releaseToken('token-1')
  await jest.runAllTimersAsync()
  await signOut

  const lastSave = Math.max(...notifications.savePushTokenToDevice.mock.invocationCallOrder)
  const [removal] = notifications.removePushTokenFromDevice.mock.invocationCallOrder
  expect(notifications.removePushTokenFromDevice).toHaveBeenCalledWith('user-1', 'token-1')
  expect(removal).toBeGreaterThan(lastSave)
  expect(push.useNotificationStore.getState().expoPushToken).toBeNull()
})

it('skips a registration queued behind one in flight once sign-out starts', async () => {
  await emitAuth('INITIAL_SESSION', 'user-1')

  let releaseToken!: (token: string) => void
  notifications.getExpoPushToken.mockReturnValueOnce(new Promise((resolve) => (releaseToken = resolve)))
  await emitAuth('TOKEN_REFRESHED', 'user-1') // in flight, waiting on Expo
  await emitAuth('SIGNED_IN', 'user-2') // a fresh sign-in queues behind it
  notifications.savePushTokenToDevice.mockClear()

  const signOut = push.unregisterPushBeforeSignOut()
  releaseToken('token-1')
  await jest.runAllTimersAsync()
  await signOut

  expect(notifications.savePushTokenToDevice).not.toHaveBeenCalledWith('user-2', expect.anything())
})

it('does not register again after sign-out has started', async () => {
  await emitAuth('INITIAL_SESSION', 'user-1')
  await push.unregisterPushBeforeSignOut()
  notifications.savePushTokenToDevice.mockClear()

  // The OS rotates the token between unregistering and SIGNED_OUT arriving.
  const onRotation = notifications.addPushTokenChangeListener.mock.calls[0][0] as () => void
  onRotation()
  await jest.runAllTimersAsync()

  expect(notifications.savePushTokenToDevice).not.toHaveBeenCalled()
})
