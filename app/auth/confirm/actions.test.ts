import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('auth confirm action', () => {
  const actionSource = () => readFileSync(join(process.cwd(), 'app', 'auth', 'confirm', 'actions.ts'), 'utf8')

  it('only verifies Supabase token hashes after the user submits the form', () => {
    const source = actionSource()

    expect(source).toContain("'use server'")
    expect(source).toContain('confirmEmail')
    expect(source).toContain('verifyOtp')
    expect(source).toContain('token_hash: tokenHash')
  })

  it('redirects expired verification links with a specific login error', () => {
    const source = actionSource()

    expect(source).toContain('verification_link_expired')
    expect(source).toContain('otp_expired')
  })
})
