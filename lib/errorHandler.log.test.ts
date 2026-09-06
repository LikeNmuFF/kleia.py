import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('logAndGetSafeError', () => {
  it('normalizes log labels so attacker-controlled endpoint text cannot forge log lines', async () => {
    vi.resetModules()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { logAndGetSafeError } = await import('./errorHandler')

    logAndGetSafeError('api/users\n[admin] success', new Error('boom'), 'fallback')

    expect(errorSpy).toHaveBeenCalledWith(
      '%s',
      '[api/users\\n[admin] success]',
      expect.any(Error)
    )
  })
})
