import { afterEach, describe, expect, it } from 'vitest'
import { buildAuthCallbackUrl } from './redirect-url'

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
})

describe('buildAuthCallbackUrl', () => {
  it('builds a production callback URL when NEXT_PUBLIC_SITE_URL is not configured', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL

    expect(buildAuthCallbackUrl()).toBe('https://www.kleia.site/auth/callback')
  })

  it('keeps the reset-password next path inside the callback URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.kleia.site/'

    expect(buildAuthCallbackUrl('/reset-password')).toBe(
      'https://www.kleia.site/auth/callback?next=%2Freset-password'
    )
  })

  it('rejects external next paths', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.kleia.site'

    expect(buildAuthCallbackUrl('https://evil.example/phish')).toBe('https://www.kleia.site/auth/callback')
  })
})
