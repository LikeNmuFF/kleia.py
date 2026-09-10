import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = () => readFileSync(join(process.cwd(), 'app', '(main)', 'ctf', '[id]', 'FlagSubmitForm.tsx'), 'utf8')

describe('FlagSubmitForm UI contract', () => {
  it('gives the flag input the available width and stacks controls on small screens', () => {
    const code = source()

    expect(code).toContain('flex flex-col gap-3 sm:flex-row')
    expect(code).toContain('w-full min-w-0 flex-1')
    expect(code).toContain('font-mono')
    expect(code).toContain('placeholder="Enter flag (e.g. flag{...})"')
    expect(code).toContain('focus:ring-2 focus:ring-purple-500')
  })

  it('keeps the submit action content-sized and disabled for an empty flag', () => {
    const code = source()

    expect(code).toContain('disabled={loading || !flag.trim()}')
    expect(code).toContain('w-fit self-start shrink-0 px-6 py-3')
    expect(code).toContain("loading ? 'Checking…' : 'Submit flag'")
  })

  it('renders distinct correct and incorrect feedback states', () => {
    const code = source()

    expect(code).toContain("type: result.isCorrect ? 'success' : 'incorrect'")
    expect(code).toContain('border-emerald-500')
    expect(code).toContain('shadow-emerald-500/20')
    expect(code).toContain('border-red-500')
    expect(code).toContain('flagShake')
    expect(code).toContain('<CheckCircle2')
    expect(code).toContain('<XCircle')
  })

  it('uses the dark challenge-card surface', () => {
    const code = source()

    expect(code).toContain('border-white/10 bg-[#0a0a0f]')
  })
})
