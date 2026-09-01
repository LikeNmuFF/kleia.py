import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('public route allowlist', () => {
  it('keeps club recruitment pages reachable without login', () => {
    const source = readFileSync(join(process.cwd(), 'lib', 'supabase', 'middleware.ts'), 'utf8')

    expect(source).toContain("'/cco'")
    expect(source).not.toContain("'/clubs'")
  })
})
