import { errorMessage } from '../feedback'

it('uses an Error’s message', () => {
  expect(errorMessage(new Error('Invalid login credentials'))).toBe('Invalid login credentials')
})

it('uses a thrown string', () => {
  expect(errorMessage('Offline')).toBe('Offline')
})

it('falls back for anything else', () => {
  expect(errorMessage(undefined)).toBe('An unexpected error occurred')
  expect(errorMessage({ code: 42 }, 'Could not save')).toBe('Could not save')
  expect(errorMessage(new Error(''), 'Could not save')).toBe('Could not save')
})
