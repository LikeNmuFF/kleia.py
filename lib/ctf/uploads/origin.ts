const PRODUCTION_ORIGIN = 'https://www.kleia.site'

export function isAllowedUploadOrigin(origin: string | null, siteUrl?: string): boolean {
  if (!origin) return false
  const allowed = new Set([PRODUCTION_ORIGIN])
  if (siteUrl) {
    try {
      const configured = new URL(siteUrl)
      if (configured.protocol === 'https:' || configured.protocol === 'http:') {
        allowed.add(configured.origin)
      }
    } catch {
      // Invalid configuration must not disable the canonical production origin.
    }
  }
  return allowed.has(origin)
}
