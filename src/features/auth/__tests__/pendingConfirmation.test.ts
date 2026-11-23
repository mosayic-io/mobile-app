import { AuthError } from '@supabase/supabase-js'

import { signInWith } from '../providers'
import {
  abandonConfirmation,
  awaitConfirmation,
  tryCompleteConfirmation,
} from '../pendingConfirmation'

jest.mock('../providers', () => ({ signInWith: jest.fn() }))
jest.mock('@/src/lib/supabase', () => ({ supabase: { auth: { resend: jest.fn() } } }))

const mockSignIn = signInWith as jest.MockedFunction<typeof signInWith>

beforeEach(() => {
  mockSignIn.mockReset()
  abandonConfirmation()
})

it('is lost when nothing is pending (a cold start)', async () => {
  await expect(tryCompleteConfirmation()).resolves.toBe('lost')
  expect(mockSignIn).not.toHaveBeenCalled()
})

it('signs in with the sign-up password, then forgets it', async () => {
  mockSignIn.mockResolvedValue('signed-in')
  awaitConfirmation('a@b.co', 'secret')

  await expect(tryCompleteConfirmation()).resolves.toBe('signed-in')
  expect(mockSignIn).toHaveBeenCalledWith({ provider: 'password', email: 'a@b.co', password: 'secret' })
  await expect(tryCompleteConfirmation()).resolves.toBe('lost')
})

it('is not-yet while the link has not been opened, and keeps the password', async () => {
  mockSignIn.mockRejectedValueOnce(new AuthError('Email not confirmed', 400, 'email_not_confirmed'))
  awaitConfirmation('a@b.co', 'secret')

  await expect(tryCompleteConfirmation()).resolves.toBe('not-yet')

  mockSignIn.mockResolvedValueOnce('signed-in')
  await expect(tryCompleteConfirmation()).resolves.toBe('signed-in')
})

it('throws real failures', async () => {
  mockSignIn.mockRejectedValue(new Error('Network down'))
  awaitConfirmation('a@b.co', 'secret')

  await expect(tryCompleteConfirmation()).rejects.toThrow('Network down')
})

it('shares one attempt between concurrent calls, so neither reports lost', async () => {
  let finish!: () => void
  mockSignIn.mockReturnValue(new Promise((resolve) => (finish = () => resolve('signed-in'))))
  awaitConfirmation('a@b.co', 'secret')

  const foregroundRetry = tryCompleteConfirmation()
  const buttonPress = tryCompleteConfirmation()
  finish()

  await expect(Promise.all([foregroundRetry, buttonPress])).resolves.toEqual(['signed-in', 'signed-in'])
  expect(mockSignIn).toHaveBeenCalledTimes(1)
})
