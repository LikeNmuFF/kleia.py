import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('/cco page', () => {
  it('shows a live registration count and footer login link', () => {
    const source = readFileSync(join(process.cwd(), 'app', '(public)', 'cco', 'page.tsx'), 'utf8')

    expect(source).toContain('<CcoLiveCount />')
    expect(source).toContain('Login to join the community')
    expect(source).toContain('href="/login"')
  })
})
