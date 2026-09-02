import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('auth confirm route', () => {
  const routeSource = () => readFileSync(join(process.cwd(), 'app', 'auth', 'confirm', 'route.ts'), 'utf8')

  it('verifies Supabase email template token hashes server-side', () => {
    const source = routeSource()

    expect(source).toContain("searchParams.get('token_hash')")
    expect(source).toContain("searchParams.get('type')")
    expect(source).toContain('verifyOtp')
    expect(source).toContain('token_hash: tokenHash')
  })

  it('redirects invalid or expired verification links with a specific login error', () => {
    const source = routeSource()

    expect(source).toContain('verification_link_expired')
    expect(source).toContain('otp_expired')
  })
})
