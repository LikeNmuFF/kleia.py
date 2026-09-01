import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('AdminDashboard CCO tab', () => {
  it('exposes CCO sign-up monitoring to admins', () => {
    const source = readFileSync(join(process.cwd(), 'components', 'admin', 'AdminDashboard.tsx'), 'utf8')

    expect(source).toContain("id: 'cco'")
    expect(source).toContain("label: 'CCO Sign-ups'")
    expect(source).toContain('<CcoSignupsTab />')
  })
})
