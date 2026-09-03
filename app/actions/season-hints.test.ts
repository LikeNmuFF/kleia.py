import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getSeasonHintCost } from './competition-status'

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
    expect(source).toContain("rpc('unlock_progressive_season_hint'")
  })

  it('increases the hint price by 25 points across the season', () => {
    expect(getSeasonHintCost(0)).toBe(25)
    expect(getSeasonHintCost(1)).toBe(50)
    expect(getSeasonHintCost(2)).toBe(75)
    expect(getSeasonHintCost(9)).toBe(250)
  })

  it('calculates and charges the progressive price atomically in the database', () => {
    const migration = readFileSync(join(process.cwd(), 'supabase', 'migrations', '20260903020000_progressive_season_hints.sql'), 'utf8')

    expect(migration).toContain('unlock_progressive_season_hint')
    expect(migration).toContain('COUNT(*)')
    expect(migration).toContain('(prior_unlocks + 1) * 25')
    expect(migration).toContain("status = 'live'")
    expect(migration).toContain('pg_advisory_xact_lock')
    expect(migration).toContain('RETURN actual_penalty')
  })

  it('renders challenge files and links inside the season competition modal', () => {
    const source = readFileSync(join(process.cwd(), 'app', '(main)', 'ctf', 'seasons', '[slug]', 'compete', 'CompetitionClient.tsx'), 'utf8')

    expect(source).toContain('file_url: string | null')
    expect(source).toContain('link_url: string | null')
    expect(source).toContain('Download File')
    expect(source).toContain('Open Challenge Link')
  })
})
