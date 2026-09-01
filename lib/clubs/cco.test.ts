import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('CCO club setup helper', () => {
  it('is used by public registration and count APIs', () => {
    const registrationRoute = readFileSync(join(process.cwd(), 'app', 'api', 'cco', 'registrations', 'route.ts'), 'utf8')
    const countRoute = readFileSync(join(process.cwd(), 'app', 'api', 'cco', 'count', 'route.ts'), 'utf8')

    expect(registrationRoute).toContain('ensureCcoClub')
    expect(countRoute).toContain('ensureCcoClub')
  })
})
