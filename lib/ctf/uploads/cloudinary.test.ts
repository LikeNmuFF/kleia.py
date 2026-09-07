import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { getModerationStatus, refreshChallengeFileModerationStatus, verifyCloudinaryWebhookSignature } from './cloudinary'

describe('cloudinary upload boundary', () => {
  it('extracts Perception Point moderation statuses only', () => {
    expect(getModerationStatus({ moderation: [{ kind: 'perception_point', status: 'pending' }] })).toBe('pending')
    expect(getModerationStatus({ moderation: [{ kind: 'perception_point', status: 'approved' }] })).toBe('approved')
    expect(getModerationStatus({ moderation: [{ kind: 'perception_point', status: 'rejected' }] })).toBe('rejected')
    expect(getModerationStatus({ moderation: [{ kind: 'manual', status: 'approved' }] })).toBeNull()
  })

  it('refreshes a raw authenticated upload moderation status by public ID', async () => {
    const fetchResource = async (publicId: string, options: Record<string, unknown>) => {
      expect(publicId).toBe('kleia-ctf-files/user/upload')
      expect(options).toEqual({ resource_type: 'raw', type: 'authenticated', moderation: true })
      return { moderation: [{ kind: 'perception_point', status: 'approved' }] }
    }

    await expect(refreshChallengeFileModerationStatus('kleia-ctf-files/user/upload', fetchResource)).resolves.toBe('approved')
  })

  it('verifies webhook signatures within five minutes', () => {
    process.env.CLOUDINARY_API_SECRET = 'secret'
    const body = JSON.stringify({ public_id: 'kleia-ctf-files/u/file' })
    const timestamp = '1800000000'
    const signature = createHash('sha1').update(body + timestamp + 'secret').digest('hex')
    expect(verifyCloudinaryWebhookSignature(body, signature, timestamp, 1800000100_000)).toBe(true)
    expect(verifyCloudinaryWebhookSignature(body, signature, timestamp, 1800000401_000)).toBe(false)
  })
})
