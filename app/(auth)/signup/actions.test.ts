import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('signup action email confirmation redirect', () => {
  it('sends Supabase email signups back through the app auth callback', () => {
    const actionSource = readFileSync(join(process.cwd(), 'app', '(auth)', 'signup', 'actions.ts'), 'utf8')

    expect(actionSource).toContain('emailRedirectTo: buildAuthCallbackUrl()')
  })

  it('does not bypass email confirmation when Supabase email delivery is rate limited', () => {
    const actionSource = readFileSync(join(process.cwd(), 'app', '(auth)', 'signup', 'actions.ts'), 'utf8')

    expect(actionSource).toContain('isEmailSendRateLimitError(error)')
    expect(actionSource).not.toContain('getServiceClient()')
    expect(actionSource).not.toContain('auth.admin.createUser')
    expect(actionSource).not.toContain('email_confirm: true')
    expect(actionSource).not.toContain('signInWithPassword')
  })
})
