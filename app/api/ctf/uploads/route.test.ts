import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('/api/ctf/uploads route', () => {
  it('authenticates, authorizes, scans, and stores uploads through the backend', () => {
    const source = readFileSync(join(process.cwd(), 'app', 'api', 'ctf', 'uploads', 'route.ts'), 'utf8')

    expect(source).toContain("export const runtime = 'nodejs'")
    expect(source).toContain('auth.getUser()')
    expect(source).toContain('checkNamedRateLimit')
    expect(source).toContain('ctf-upload')
    expect(source).toContain('normalizeUploadFileName')
    expect(source).toContain('uploadChallengeFile')
    expect(source).toContain('getServiceClient')
    expect(source).toContain('ctf_challenge_uploads')
    expect(source).toContain('canUploadSeasonChallengeFile')
    expect(source).toContain('canUploadGlobalChallengeFile')
    expect(source).toContain('destroyChallengeFile')
  })
})
