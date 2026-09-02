const DEFAULT_SITE_URL = 'https://www.kleia.site'

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
}

export function buildAuthCallbackUrl(nextPath?: string) {
  const callbackUrl = new URL('/auth/callback', getSiteUrl())

  if (nextPath?.startsWith('/') && !nextPath.includes('://')) {
    callbackUrl.searchParams.set('next', nextPath)
  }

  return callbackUrl.toString()
}
