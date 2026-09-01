import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('CcoJoinForm hydration tolerance', () => {
  it('suppresses hydration warnings on browser-extension-mutated controls', () => {
    const source = readFileSync(join(process.cwd(), 'components', 'clubs', 'CcoJoinForm.tsx'), 'utf8')

    expect(source.match(/suppressHydrationWarning/g)?.length ?? 0).toBeGreaterThanOrEqual(6)
  })
})
