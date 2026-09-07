import { Writable } from 'node:stream'
import { afterEach, expect, it, vi } from 'vitest'
import { v2 as cloudinary } from 'cloudinary'
import { uploadChallengeFile } from './cloudinary'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

it('uploads authenticated files without requesting moderation or requiring scan results', async () => {
  vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'test')
  vi.stubEnv('CLOUDINARY_API_KEY', 'test')
  vi.stubEnv('CLOUDINARY_API_SECRET', 'test')
  const chunks: Buffer[] = []
  const upload = vi.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(((options: any, callback: any) => {
    expect(options.resource_type).toBe('raw')
    expect(options.type).toBe('authenticated')
    expect(options).not.toHaveProperty('moderation')
    expect(options).not.toHaveProperty('notification_url')
    return new Writable({
      write(chunk, _encoding, done) { chunks.push(Buffer.from(chunk)); done() },
      final(done) { callback(null, { asset_id: 'asset', public_id: options.public_id }); done() },
    })
  }) as any)
  const result = await uploadChallengeFile({ buffer: Buffer.from('test file'), originalName: 'test.txt', storedName: 'test.txt', sha256: 'hash' }, 'owner')
  expect(upload).toHaveBeenCalledOnce()
  expect(Buffer.concat(chunks).toString()).toBe('test file')
  expect(result.assetId).toBe('asset')
  expect(result.publicId).toMatch(/^kleia-ctf-files\/owner\//)
})
