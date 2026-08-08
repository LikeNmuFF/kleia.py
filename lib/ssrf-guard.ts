import dns from 'node:dns/promises'
import net from 'node:net'

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\.0\.0\.0/,
  (ip: string) => {
    const parts = ip.split('.').map(Number)
    return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31
  },
]

export function isPrivateIP(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return PRIVATE_RANGES.some(r =>
      typeof r === 'function' ? r(ip) : r.test(ip)
    )
  }
  if (net.isIPv6(ip)) {
    const norm = ip.toLowerCase()
    return (
      norm === '::1' ||
      norm.startsWith('fc') ||
      norm.startsWith('fd') ||
      norm.startsWith('fe8') ||
      norm.startsWith('fe9') ||
      norm.startsWith('fea') ||
      norm.startsWith('feb')
    )
  }
  return true
}

export async function resolveAndCheckHost(hostname: string): Promise<boolean> {
  try {
    const addrs = await dns.lookup(hostname, { all: true })
    return addrs.every(a => !isPrivateIP(a.address))
  } catch {
    return false
  }
}

export function hasCredentials(parsed: URL): boolean {
  return parsed.username !== '' || parsed.password !== ''
}
