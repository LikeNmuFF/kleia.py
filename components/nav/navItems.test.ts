import { describe, expect, it } from 'vitest'
import { COMMUNITY_NAV, DESKTOP_PRIMARY_NAV, getChallengeNav } from './navItems'

describe('desktop navigation grouping', () => {
  it('keeps community items out of the desktop top-level links', () => {
    const communityHrefs = new Set(COMMUNITY_NAV.map((item) => item.href))

    expect(
      DESKTOP_PRIMARY_NAV.filter((item) => communityHrefs.has(item.href))
    ).toEqual([])
  })

  it('exposes teams in community navigation', () => {
    expect(COMMUNITY_NAV.some((item) => item.href === '/teams')).toBe(true)
  })

  it('only exposes Labs to invited users or admins', () => {
    expect(getChallengeNav(false).some((item) => item.href === '/practice')).toBe(false)
    expect(getChallengeNav(true).find((item) => item.href === '/practice')?.label).toBe('Labs')
  })
})
