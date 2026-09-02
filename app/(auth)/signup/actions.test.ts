import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('signup action email confirmation redirect', () => {
  it('sends Supabase email signups back through the app auth callback', () => {
    const actionSource = readFileSync(join(process.cwd(), 'app', '(auth)', 'signup', 'actions.ts'), 'utf8')

    expect(actionSource).toContain('emailRedirectTo: buildAuthCallbackUrl()')
  })

  it('recovers from Supabase confirmation email rate limits with server-side confirmed account creation', () => {
    const actionSource = readFileSync(join(process.cwd(), 'app', '(auth)', 'signup', 'actions.ts'), 'utf8')

    expect(actionSource).toContain('isEmailSendRateLimitError(error)')
    expect(actionSource).toContain('getServiceClient()')
    expect(actionSource).toContain('auth.admin.createUser')
    expect(actionSource).toContain('email_confirm: true')
    expect(actionSource).toContain('signInWithPassword')
  })
})
