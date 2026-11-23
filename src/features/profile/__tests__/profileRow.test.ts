import { supabase } from '@/src/lib/supabase'

import { normaliseDisplayName, seedProfileFromProvider } from '../profileRow'

const mockEq = jest.fn().mockResolvedValue({ error: null })
const mockUpdate = jest.fn(() => ({ eq: mockEq }))

jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: { updateUser: jest.fn().mockResolvedValue({ error: null }) },
    from: jest.fn(() => ({ update: mockUpdate })),
  },
}))
jest.mock('@/src/lib/queryClient', () => ({ queryClient: { invalidateQueries: jest.fn(), setQueryData: jest.fn() } }))

beforeEach(() => jest.clearAllMocks())

describe('normaliseDisplayName', () => {
  it('trims', () => {
    expect(normaliseDisplayName('  Ada Lovelace ')).toBe('Ada Lovelace')
  })

  it('stores an empty name as null', () => {
    expect(normaliseDisplayName('   ')).toBeNull()
  })
})

describe('seedProfileFromProvider', () => {
  it('UPDATEs only the fields the provider knows, never upserts', async () => {
    await seedProfileFromProvider('user-1', { name: 'Ada', photo: null, email: 'ada@example.com' })

    expect(supabase.from).toHaveBeenCalledWith('users')
    expect(mockUpdate).toHaveBeenCalledWith({ display_name: 'Ada', email: 'ada@example.com' })
    expect(mockEq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('never throws: a failed write must not undo the sign-in', async () => {
    mockEq.mockResolvedValueOnce({ error: new Error('permission denied for table users') })
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(
      seedProfileFromProvider('user-1', { name: 'Ada', photo: null, email: null })
    ).resolves.toBeUndefined()
    warn.mockRestore()
  })
})
