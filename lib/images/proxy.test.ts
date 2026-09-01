import { describe, expect, it } from 'vitest'
import { getProxiedImageSrc, isBlockedProxyImageUrl } from './image-proxy-url'

describe('getProxiedImageSrc', () => {
  it('does not proxy Facebook page or CDN image URLs that commonly fail server-side', () => {
    expect(getProxiedImageSrc('https://www.facebook.com/share/p/1DKQ3F2zzx/')).toBeNull()
    expect(getProxiedImageSrc('https://scontent-iad6-1.xx.fbcdn.net/v/t39.30808-6/photo.jpg?oh=abc')).toBeNull()
  })

  it('proxies ordinary HTTPS image URLs through the local image proxy', () => {
    expect(getProxiedImageSrc('https://res.cloudinary.com/demo/image/upload/sample.jpg')).toBe(
      '/api/image-proxy?url=https%3A%2F%2Fres.cloudinary.com%2Fdemo%2Fimage%2Fupload%2Fsample.jpg'
    )
  })

  it('does not proxy invalid or non-HTTPS URLs', () => {
    expect(getProxiedImageSrc('not-a-url')).toBeNull()
    expect(getProxiedImageSrc('http://example.com/image.jpg')).toBeNull()
  })

  it('identifies Facebook URLs that should get an empty proxy response instead of a 502', () => {
    expect(isBlockedProxyImageUrl('https://www.facebook.com/share/p/1DKQ3F2zzx/')).toBe(true)
    expect(isBlockedProxyImageUrl('https://scontent-iad6-1.xx.fbcdn.net/v/t39.30808-6/photo.jpg')).toBe(true)
    expect(isBlockedProxyImageUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg')).toBe(false)
  })
})
