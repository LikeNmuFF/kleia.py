import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage, getLoginErrorMessage, isEmailSendRateLimitError } from './errors'

describe('isEmailSendRateLimitError', () => {
  it('recognizes Supabase email send rate limit errors by code', () => {
    expect(isEmailSendRateLimitError({
      code: 'over_email_send_rate_limit',
      status: 429,
      message: 'email rate limit exceeded',
    })).toBe(true)
  })

  it('recognizes Supabase email send rate limit errors by status and message', () => {
    expect(isEmailSendRateLimitError({
      status: 429,
      message: 'Email rate limit exceeded',
    })).toBe(true)
  })

  it('does not treat unrelated auth failures as email send rate limits', () => {
    expect(isEmailSendRateLimitError({
      status: 400,
      message: 'User already registered',
    })).toBe(false)
  })
})

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

describe('getLoginErrorMessage', () => {
  it('explains expired verification links clearly', () => {
    expect(getLoginErrorMessage('verification_link_expired')).toBe('That verification link is invalid or has expired. Please sign up again to request a new link.')
  })

  it('keeps auth callback failures clear', () => {
    expect(getLoginErrorMessage('auth_failed')).toBe('We could not finish signing you in. Please try again.')
  })
})
