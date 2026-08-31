import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadHandler(env: Record<string, string | undefined>) {
  vi.resetModules()
  const previous = { ...process.env }
  process.env = { ...previous, ...env }
  const mod = await import('./errorHandler')
  process.env = previous
  return mod
}

afterEach(() => {
  vi.resetModules()
})

describe('getSafeErrorMessage', () => {
  it('hides detailed errors in production', async () => {
    const { getSafeErrorMessage } = await loadHandler({
      NODE_ENV: 'production',
      DEBUG: undefined,
      NEXT_PUBLIC_DEBUG: undefined,
    })

    const message = getSafeErrorMessage(
      { message: 'relation "conversation_members" does not exist' },
      'Failed to create group chat. Please try again.'
    )

    expect(message).toBe('Failed to create group chat. Please try again.')
  })

  it('shows detailed errors outside production for testing', async () => {
    const { getSafeErrorMessage } = await loadHandler({
      NODE_ENV: 'test',
      DEBUG: undefined,
      NEXT_PUBLIC_DEBUG: undefined,
    })

    const message = getSafeErrorMessage(
      { message: 'relation "conversation_members" does not exist' },
      'Failed to create group chat. Please try again.'
    )

    expect(message).toBe('relation "conversation_members" does not exist')
  })
})
