import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('terminal decoding Learn material', () => {
  it('ships a discoverable Linux lesson with practical decoding commands', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20260908010000_terminal_decoding_lesson.sql',
    )
    const migration = fs.readFileSync(migrationPath, 'utf8')

    expect(migration).toContain("'terminal-decoding-basics'")
    expect(migration).toContain('Terminal Decoding Basics')
    expect(migration).toContain('base64 -d')
    expect(migration).toContain("tr 'A-Za-z' 'N-ZA-Mn-za-m'")
    expect(migration).toContain('xxd -r -p')
    expect(migration).toContain('urllib.parse.unquote')
  })
})
