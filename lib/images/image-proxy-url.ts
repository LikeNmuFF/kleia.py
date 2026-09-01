const BLOCKED_PROXY_IMAGE_HOSTS = [
  'facebook.com',
  'fbcdn.net',
]

function isBlockedProxyImageHost(hostname: string) {
  return BLOCKED_PROXY_IMAGE_HOSTS.some((blockedHost) => (
    hostname === blockedHost || hostname.endsWith(`.${blockedHost}`)
  ))
}

export function isBlockedProxyImageUrl(imageUrl: string): boolean {
  try {
    const parsed = new URL(imageUrl)
    return isBlockedProxyImageHost(parsed.hostname.toLowerCase())
  } catch {
    return false
  }
}

export function getProxiedImageSrc(imageUrl: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(imageUrl)
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:') return null
  if (isBlockedProxyImageUrl(imageUrl)) return null

  return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
}
