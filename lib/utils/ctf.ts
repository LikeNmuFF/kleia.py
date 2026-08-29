import { createHash } from 'crypto'

export function hashFlag(flag: string): string {
  return createHash('sha256').update(flag.trim().toUpperCase()).digest('hex')
}
