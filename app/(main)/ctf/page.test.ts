import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const pageSource = () => readFileSync(join(process.cwd(), 'app', '(main)', 'ctf', 'page.tsx'), 'utf8')
const clientSource = () => readFileSync(join(process.cwd(), 'app', '(main)', 'ctf', 'CTFClient.tsx'), 'utf8')

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

    expect(source).toContain("rpc('get_recent_global_solves')")
    expect(source).toContain('getRecentGlobalSolves')
    expect(source).toContain('recentSolves={recentSolves}')
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

  test('client renders a recent global solves feed', () => {
    const source = clientSource()

    expect(source).toContain('Recent Solves')
    expect(source).toContain('recentSolves.length > 0')
    expect(source).toContain('timeAgo(solve.solved_at)')
  })
})
