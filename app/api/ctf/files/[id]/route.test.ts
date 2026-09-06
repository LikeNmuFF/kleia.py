import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('/api/ctf/files/[id] route', () => {
  it('serves only approved attached uploads as nosniff attachments', () => {
    const source = readFileSync(join(process.cwd(), 'app', 'api', 'ctf', 'files', '[id]', 'route.ts'), 'utf8')

    expect(source).toContain("export const runtime = 'nodejs'")
    expect(source).toContain('getChallengeFileDownloadUrl')
    expect(source).toContain('ctf_challenge_uploads')
    expect(source).toContain("scan_status', 'approved'")
    expect(source).toContain("not('challenge_id', 'is', null)")
    expect(source).toContain('isChallengePublicAfterSeasons')
    expect(source).toContain('Content-Disposition')
    expect(source).toContain('attachment')
    expect(source).toContain('X-Content-Type-Options')
    expect(source).toContain('nosniff')
    expect(source).toContain('private, no-store')
  })
})
