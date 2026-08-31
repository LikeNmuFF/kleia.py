import { createHash } from 'node:crypto'
import type { CertificateEligibility, CertificateEligibilityInput } from './types'

export function canIssueCertificate(input: CertificateEligibilityInput): CertificateEligibility {
  if (input.verificationMode === 'resource_only') {
    return { allowed: false, reason: 'not_certificate_bearing' }
  }

  if (input.verificationMode === 'external_certificate') {
    return input.externalCompletionVerified
      ? { allowed: true, reason: 'eligible' }
      : { allowed: false, reason: 'external_verification_required' }
  }

  if (input.totalAttendanceMinutes < input.minAttendanceMinutes) {
    return { allowed: false, reason: 'attendance_required' }
  }

  return { allowed: true, reason: 'eligible' }
}

export function createCertificateCode(webinarId: string, userId: string, issuedAt: Date): string {
  const digest = createHash('sha256')
    .update(`${webinarId}:${userId}:${issuedAt.toISOString()}`)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase()

  return `KLEIA-${digest}`
}
