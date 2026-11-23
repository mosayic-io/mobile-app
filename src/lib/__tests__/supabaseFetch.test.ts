import {
  AUTH_TIMEOUT_MS,
  SUPABASE_UNREACHABLE_PREVIEW_MESSAGE,
  SUPABASE_UNREACHABLE_MESSAGE,
  createSupabaseFetch,
  unreachableMessage,
} from '../supabaseFetch'

const AUTH_URL = 'http://127.0.0.1:54321/auth/v1/signup'
const REST_URL = 'http://127.0.0.1:54321/rest/v1/users'
const ok = () => new Response('{}', { status: 200 })

// A fetch that never answers, like a request to an address nobody is on —
// until it is aborted, as a real fetch would be.
const silentFetch = jest.fn((_input: RequestInfo | URL, init?: RequestInit) => {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
  })
})

beforeEach(() => {
  jest.useFakeTimers()
  silentFetch.mockClear()
})

afterEach(() => {
  jest.useRealTimers()
})

it('gives up on an auth call that gets no answer, with a plain message', async () => {
  const request = createSupabaseFetch(silentFetch)(AUTH_URL, { method: 'POST' })
  const outcome = expect(request).rejects.toThrow(SUPABASE_UNREACHABLE_MESSAGE)

  jest.advanceTimersByTime(AUTH_TIMEOUT_MS)
  await outcome
})

it('turns a refused connection into the same message', async () => {
  const refused = jest.fn().mockRejectedValue(new TypeError('Network request failed'))

  await expect(createSupabaseFetch(refused)(AUTH_URL)).rejects.toThrow(SUPABASE_UNREACHABLE_MESSAGE)
})

it('leaves a working auth call alone', async () => {
  const working = jest.fn().mockResolvedValue(ok())

  await expect(createSupabaseFetch(working)(AUTH_URL)).resolves.toBeInstanceOf(Response)
})

it('never limits database queries or uploads', async () => {
  const request = createSupabaseFetch(silentFetch)(REST_URL)
  let settled = false
  void request.finally(() => (settled = true)).catch(() => {})

  jest.advanceTimersByTime(AUTH_TIMEOUT_MS * 10)
  await Promise.resolve()

  expect(settled).toBe(false)
  expect(silentFetch.mock.calls[0][1]?.signal).toBeUndefined()
})

it('passes a caller’s own cancel through untouched', async () => {
  const caller = new AbortController()
  const request = createSupabaseFetch(silentFetch)(AUTH_URL, { signal: caller.signal })

  caller.abort()
  await expect(request).rejects.toThrow('Aborted')
})

it('keeps the Claude Code hint to the web preview; phones get a plain message', () => {
  expect(unreachableMessage(true)).toBe(SUPABASE_UNREACHABLE_PREVIEW_MESSAGE)
  expect(unreachableMessage(false)).toBe(SUPABASE_UNREACHABLE_MESSAGE)
  expect(SUPABASE_UNREACHABLE_MESSAGE).not.toMatch(/Claude|Supabase|locally/)
})
