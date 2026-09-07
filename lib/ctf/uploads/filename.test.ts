import { describe, expect, it } from 'vitest'
import { normalizeUploadFileName } from './filename'

describe('challenge upload filenames', () => {
  it('normalizes allowed filenames without loading binary image tooling', () => {
    expect(normalizeUploadFileName('..\\evil\u0000name.PDF')).toEqual({
      originalName: 'evilname.PDF',
      storedName: 'evilname.pdf',
      extension: 'pdf',
    })
  })

  it('rejects filenames without an allowed extension', () => {
    expect(() => normalizeUploadFileName('payload')).toThrow('Unsupported file type')
  })
})
