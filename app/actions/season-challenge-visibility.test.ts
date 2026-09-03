import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { canRevealSeasonChallenges, isChallengePublicAfterSeasons } from './competition-status'

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

  it('publishes season challenges only after every associated season ends', () => {
    expect(isChallengePublicAfterSeasons([])).toBe(true)
    expect(isChallengePublicAfterSeasons(['ended'])).toBe(true)
    expect(isChallengePublicAfterSeasons(['ended', 'upcoming'])).toBe(false)
    expect(isChallengePublicAfterSeasons(['live'])).toBe(false)
    expect(isChallengePublicAfterSeasons(['paused'])).toBe(false)
  })

  it('guards direct challenge URLs using their associated season statuses', () => {
    const source = readFileSync(join(process.cwd(), 'app', '(main)', 'ctf', '[id]', 'page.tsx'), 'utf8')

    expect(source).toContain('ctf_season_challenges')
    expect(source).toContain('isChallengePublicAfterSeasons')
  })

  it('removes global challenge linking from season administration', () => {
    const source = readFileSync(join(process.cwd(), 'components', 'admin', 'SeasonsAdminTab.tsx'), 'utf8')

    expect(source).not.toContain('Link challenges')
    expect(source).not.toContain('addChallengeToSeason')
  })
})
