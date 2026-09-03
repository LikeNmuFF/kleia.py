import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { canRevealSeasonChallenges } from './competition-status'

describe('season challenge visibility', () => {
  it('reveals challenges only to a participant in a live season', () => {
    expect(canRevealSeasonChallenges('upcoming', true)).toBe(false)
    expect(canRevealSeasonChallenges('paused', true)).toBe(false)
    expect(canRevealSeasonChallenges('live', false)).toBe(false)
    expect(canRevealSeasonChallenges('live', true)).toBe(true)
  })

  it('does not fetch challenge details for the public season page', () => {
    const source = readFileSync(join(process.cwd(), 'app', '(main)', 'ctf', 'seasons', '[slug]', 'page.tsx'), 'utf8')

    expect(source).not.toContain('getSeasonChallenges(season.id)')
  })

  it('fetches compete challenge details only after server-side live access is confirmed', () => {
    const source = readFileSync(join(process.cwd(), 'app', '(main)', 'ctf', 'seasons', '[slug]', 'compete', 'page.tsx'), 'utf8')

    expect(source).toContain("canRevealSeasonChallenges(access.effectiveStatus, access.kind === 'participant')")
    expect(source).toContain('? getSeasonChallenges(season.id)')
  })
})
