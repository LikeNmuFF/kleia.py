import { describe, expect, it } from 'vitest'
import { isAllowedUploadOrigin } from './origin'

describe('upload origin authorization', () => {
  it('accepts the production origin with missing or mismatched configuration', () => {
    for (const configured of [undefined, 'https://kleia.site', 'invalid']) {
      expect(isAllowedUploadOrigin('https://www.kleia.site', configured)).toBe(true)
    }
  })

  it('compares the configured origin independently of its path', () => {
    expect(isAllowedUploadOrigin('http://localhost:3000', 'http://localhost:3000/')).toBe(true)
    expect(isAllowedUploadOrigin('https://preview.example.com', 'https://preview.example.com/app/')).toBe(true)
  })

  it('rejects missing, opaque, and unrelated origins', () => {
    for (const origin of [null, 'null', 'https://evil.example', 'https://www.kleia.site.evil.example', 'http://www.kleia.site']) {
      expect(isAllowedUploadOrigin(origin, 'https://www.kleia.site')).toBe(false)
    }
  })
})
