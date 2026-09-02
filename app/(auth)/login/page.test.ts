import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('login page auth errors', () => {
  it('maps auth error codes before rendering them', () => {
    const source = readFileSync(join(process.cwd(), 'app', '(auth)', 'login', 'page.tsx'), 'utf8')

    expect(source).toContain('getLoginErrorMessage')
    expect(source).toContain('getLoginErrorMessage(error)')
  })
})
