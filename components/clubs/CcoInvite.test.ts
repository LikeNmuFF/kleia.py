import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('CcoInvite copy', () => {
  it('presents CCO as open for all students', () => {
    const source = readFileSync(join(process.cwd(), 'components', 'clubs', 'CcoInvite.tsx'), 'utf8')

    expect(source).toContain('CCO is open for all students')
    expect(source).not.toContain('CCS students')
  })
})
