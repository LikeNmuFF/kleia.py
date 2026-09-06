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
})
