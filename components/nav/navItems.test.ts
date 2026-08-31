import { describe, expect, it } from 'vitest'
import { COMMUNITY_NAV, DESKTOP_PRIMARY_NAV } from './navItems'

describe('desktop navigation grouping', () => {
  it('keeps community items out of the desktop top-level links', () => {
    const communityHrefs = new Set(COMMUNITY_NAV.map((item) => item.href))

    expect(
      DESKTOP_PRIMARY_NAV.filter((item) => communityHrefs.has(item.href))
    ).toEqual([])
  })
})
