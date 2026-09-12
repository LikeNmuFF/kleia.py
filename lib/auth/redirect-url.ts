const DEFAULT_SITE_URL = 'https://www.kleia.site'

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
}

export function getSafeNextPath(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !value.includes('://')
    && !value.includes('\\')
    && !/[\u0000-\u001f\u007f]/.test(value)
    ? value
    : '/feed'
}

export function buildAuthCallbackUrl(nextPath?: string) {
  const callbackUrl = new URL('/auth/callback', getSiteUrl())

  if (typeof nextPath === 'string' && getSafeNextPath(nextPath) !== '/feed') {
    callbackUrl.searchParams.set('next', getSafeNextPath(nextPath))
  }

  return callbackUrl.toString()
}
