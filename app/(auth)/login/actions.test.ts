import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}))

vi.mock('@/lib/errorHandler', () => ({
  getSafeErrorMessage: vi.fn(() => 'Unable to sign in. Please try again.'),
}))

vi.mock('@/lib/auth/redirect-url', () => ({
  buildAuthCallbackUrl: vi.fn(() => 'https://www.kleia.site/auth/callback'),
  getSafeNextPath: (value: FormDataEntryValue | null) =>
    typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('://')
      ? value
      : '/feed',
}))

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { login } from './actions'

describe('login', () => {
  function signedInClient() {
    return {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      },
    }
  }

  it('returns a season participant to the requested competition path', async () => {
    mocks.createClient.mockResolvedValue(signedInClient())

    const formData = new FormData()
    formData.set('email', 'participant@example.com')
    formData.set('password', 'correct-password')
    formData.set('next', '/ctf/seasons/live-season/compete')

    await expect(login(formData)).rejects.toThrow(
      'NEXT_REDIRECT:/ctf/seasons/live-season/compete'
    )
  })

  it('does not redirect to an external requested path', async () => {
    mocks.createClient.mockResolvedValue(signedInClient())

    const formData = new FormData()
    formData.set('email', 'participant@example.com')
    formData.set('password', 'correct-password')
    formData.set('next', 'https://evil.example/phish')

    await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT:/feed')
  })

  it('does not expose provider or database errors to the user', async () => {
    const client = signedInClient()
    client.auth.signInWithPassword.mockResolvedValue({ error: { message: 'database relation details' } })
    mocks.createClient.mockResolvedValue(client)

    const formData = new FormData()
    formData.set('email', 'participant@example.com')
    formData.set('password', 'correct-password')

    await expect(login(formData)).rejects.toThrow(
      'NEXT_REDIRECT:/login?error=Unable%20to%20sign%20in.%20Please%20try%20again.'
    )
  })
})
