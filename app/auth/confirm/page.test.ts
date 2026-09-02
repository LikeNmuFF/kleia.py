import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('auth confirm page', () => {
  const pageSource = () => readFileSync(join(process.cwd(), 'app', 'auth', 'confirm', 'page.tsx'), 'utf8')

  it('renders a confirmation form without verifying the token on page load', () => {
    const source = pageSource()

    expect(source).toContain('confirmEmail')
    expect(source).toContain('name="token_hash"')
    expect(source).toContain('name="type"')
    expect(source).not.toContain('verifyOtp')
  })
})

describe('Supabase confirmation email template', () => {
  it('routes confirmation links through the click-to-verify page', () => {
    const template = readFileSync(join(process.cwd(), 'supabase-confirmation-email.html'), 'utf8')

    expect(template).toContain('/auth/confirm')
    expect(template).toContain('{{ .TokenHash }}')
    expect(template).not.toContain('{{ .ConfirmationURL }}')
  })
})
