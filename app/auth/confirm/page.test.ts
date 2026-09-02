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
