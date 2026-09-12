import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const pageSource = () => readFileSync(join(process.cwd(), 'app', '(main)', 'ctf', 'page.tsx'), 'utf8')
const clientSource = () => readFileSync(join(process.cwd(), 'app', '(main)', 'ctf', 'CTFClient.tsx'), 'utf8')
const solvesPageSource = () => readFileSync(join(process.cwd(), 'app', '(main)', 'ctf', 'solves', 'page.tsx'), 'utf8')
const feedSource = () => readFileSync(join(process.cwd(), 'components', 'ctf', 'RecentSolvesFeed.tsx'), 'utf8')
const actionSource = () => readFileSync(join(process.cwd(), 'app', 'actions', 'recent-global-solves.ts'), 'utf8')
const solvesApiSource = () => readFileSync(join(process.cwd(), 'app', 'api', 'ctf', 'recent-solves', 'route.ts'), 'utf8')

describe('/ctf season filtering', () => {
  test('loads season filter options and passes selected season to the CTF client', () => {
    const source = pageSource()

    expect(source).toContain('searchParams')
    expect(source).toContain('getSeasonFilterData')
    expect(source).toContain('seasonOptions={seasonOptions}')
    expect(source).toContain('initialSeasonSlug={seasonSlug}')
    expect(source).toContain('seasonSlugs')
  })

  test('client filters the challenge grid by season slug before category and solved filters', () => {
    const source = clientSource()

    expect(source).toContain('seasonOptions')
    expect(source).toContain('activeSeasonSlug')
    expect(source).toContain("href={`/ctf?season=${")
    expect(source).toContain('bySeason')
    expect(source.indexOf('const bySeason = useMemo')).toBeLessThan(source.indexOf('const byCategory = useMemo'))
  })

  test('server loads recent global solves and passes them to the client', () => {
    const source = pageSource()

    expect(source).toContain('getRecentGlobalSolves')
    expect(source).toContain('recentSolves={recentSolves}')
    // The RPC call lives in the shared server action.
    expect(actionSource()).toContain("rpc('get_recent_global_solves')")
  })

  test('exposes a public /ctf/solves page that renders the feed', () => {
    const source = solvesPageSource()

    expect(source).toContain('getRecentGlobalSolves')
    expect(source).toContain('RecentSolvesFeed')
    expect(source).toContain('Recent Solves')
  })

  test('client exposes a sort control and applies it to the filtered grid', () => {
    const source = clientSource()

    expect(source).toContain('SORT_OPTIONS')
    expect(source).toContain('activeSort')
    expect(source).toContain('const sorted = useMemo')
    // Sorting must be computed after filtering (built on `filtered`).
    expect(source.indexOf('const sorted = useMemo')).toBeGreaterThan(source.indexOf('const filtered = useMemo'))
    // The grid renders the sorted list, not the raw filtered list.
    expect(source).toContain('{sorted.map(')
  })

  test('client renders the recent global solves feed via the shared component', () => {
    const source = clientSource()

    // CTFClient delegates to the shared feed component (also used by /ctf/solves).
    expect(source).toContain('RecentSolvesFeed')
    expect(source).toContain('solves={recentSolves}')
    // A header button on /ctf links to the public solves page.
    expect(source).toContain('href="/ctf/solves"')
    // The feed markup lives in the shared component.
    const feed = feedSource()
    expect(feed).toContain('Recent Solves')
    expect(feed).toContain('solves.length === 0')
    expect(feed).toContain('timeAgo(solve.solved_at)')
    // The feed never renders an empty section.
    expect(feed).not.toContain('{solves.length > 0')
  })

  test('feed updates live: client polls the public solves endpoint', () => {
    const feed = feedSource()

    expect(feed).toContain("'use client'")
    expect(feed).toContain("fetch('/api/ctf/recent-solves'")
    expect(feed).toContain('setInterval')
    // Polling pauses while the tab is hidden, resumes on focus.
    expect(feed).toContain('document.hidden')
    expect(feed).toContain('visibilitychange')
    // Fresh solves get a NEW badge, and the header shows a Live indicator.
    expect(feed).toContain('isFresh')
    expect(feed).toContain('animate-pulse')
  })

  test('public solves endpoint serves uncached RPC data with rate limiting', () => {
    const source = solvesApiSource()

    expect(source).toContain("rpc('get_recent_global_solves')")
    expect(source).toContain('getServiceClient')
    expect(source).toContain('no-store')
    expect(source).toContain('checkNamedRateLimit')
  })
})
