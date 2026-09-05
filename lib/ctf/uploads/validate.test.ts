import { describe, expect, it } from 'vitest'
import { MAX_UPLOAD_BYTES } from './types'
import { normalizeUploadFileName, validateChallengeUpload } from './validate'

describe('secure challenge upload validation', () => {
  it('normalizes display filenames and rejects extensionless files', () => {
    expect(normalizeUploadFileName('..\\evil\u0000name.PDF')).toMatchObject({
      originalName: 'evilname.PDF',
      storedName: 'evilname.pdf',
      extension: 'pdf',
    })
    expect(() => normalizeUploadFileName('payload')).toThrow('Unsupported file type')
  })

  it('rejects oversize buffers before parsing', async () => {
    await expect(validateChallengeUpload('big.txt', Buffer.alloc(MAX_UPLOAD_BYTES + 1, 0x61)))
      .rejects.toThrow('File exceeds 25 MB')
  })

  it('rejects extension and magic-byte disagreement', async () => {
    const pngHeader = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')
    await expect(validateChallengeUpload('picture.pdf', Buffer.concat([pngHeader, Buffer.alloc(64)])))
      .rejects.toThrow('Unsupported file type')
  })

  it('rejects text with NUL bytes and invalid JSON', async () => {
    await expect(validateChallengeUpload('notes.txt', Buffer.from([0x61, 0x00, 0x62])))
      .rejects.toThrow('Unsupported file type')
    await expect(validateChallengeUpload('config.json', Buffer.from('{bad json', 'utf8')))
      .rejects.toThrow('Unsupported file type')
  })
})
