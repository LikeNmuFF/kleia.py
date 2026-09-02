import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('signup action email confirmation redirect', () => {
  it('sends Supabase email signups back through the app auth callback', () => {
    const actionSource = readFileSync(join(process.cwd(), 'app', '(auth)', 'signup', 'actions.ts'), 'utf8')

    expect(actionSource).toContain('emailRedirectTo: buildAuthCallbackUrl()')
  })
})
