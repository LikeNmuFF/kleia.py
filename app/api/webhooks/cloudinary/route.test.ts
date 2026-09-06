import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('/api/webhooks/cloudinary route', () => {
  it('verifies signatures and updates malware scan status idempotently', () => {
    const source = readFileSync(join(process.cwd(), 'app', 'api', 'webhooks', 'cloudinary', 'route.ts'), 'utf8')

    expect(source).toContain("export const runtime = 'nodejs'")
    expect(source).toContain('request.text()')
    expect(source).toContain('verifyCloudinaryWebhookSignature')
    expect(source).toContain('getModerationStatus')
    expect(source).toContain('ctf_challenge_uploads')
    expect(source).toContain("scan_status', 'pending'")
    expect(source).toContain('destroyChallengeFile')
    expect(source).toContain('scanned_at')
  })
})
