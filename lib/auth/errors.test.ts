import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from './errors'

describe('getAuthErrorMessage', () => {
  it('explains Supabase email send rate limits to signup users', () => {
    expect(getAuthErrorMessage({
      code: 'over_email_send_rate_limit',
      status: 429,
      message: 'email rate limit exceeded',
    })).toBe('Too many confirmation emails were requested. Please wait a few minutes, then try signing up again.')
  })

  it('keeps duplicate account errors clear', () => {
    expect(getAuthErrorMessage({ message: 'User already registered' })).toBe('An account with this email already exists')
  })

  it('uses a generic fallback for unknown auth errors in production-safe paths', () => {
    expect(getAuthErrorMessage({ message: 'unexpected provider internals' })).toBe('Something went wrong. Please try again.')
  })
})
