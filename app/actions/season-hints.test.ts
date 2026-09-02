import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('season hint scoring', () => {
  it('has an atomic one-time season hint deduction migration', () => {
    const migration = readFileSync(join(process.cwd(), 'supabase', 'migrations', '20260902230439_season_hint_penalties.sql'), 'utf8')

    expect(migration).toContain('ctf_season_hint_unlocks')
    expect(migration).toContain('ON CONFLICT (season_id, challenge_id, user_id) DO NOTHING')
    expect(migration).toContain('total_points = GREATEST')
    expect(migration).toContain('p_penalty integer DEFAULT 10')
  })

  it('exposes a server action for season hint unlocks', () => {
    const source = readFileSync(join(process.cwd(), 'app', 'actions', 'competition.ts'), 'utf8')

    expect(source).toContain('unlockSeasonHint')
    expect(source).toContain("rpc('unlock_season_hint'")
  })
})
