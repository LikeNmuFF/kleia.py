import { describe, expect, it } from 'vitest'
import { canIssueCertificate, createCertificateCode } from './certificates'

describe('canIssueCertificate', () => {
  it('allows internal attendance certificates when recorded minutes meet the threshold', () => {
    expect(
      canIssueCertificate({
        verificationMode: 'internal_attendance',
        totalAttendanceMinutes: 45,
        minAttendanceMinutes: 30,
        externalCompletionVerified: false,
      })
    ).toEqual({ allowed: true, reason: 'eligible' })
  })

  it('denies internal attendance certificates when attendance is too short', () => {
    expect(
      canIssueCertificate({
        verificationMode: 'internal_attendance',
        totalAttendanceMinutes: 12,
        minAttendanceMinutes: 30,
        externalCompletionVerified: false,
      })
    ).toEqual({ allowed: false, reason: 'attendance_required' })
  })

  it('allows external certificates only after staff verification', () => {
    expect(
      canIssueCertificate({
        verificationMode: 'external_certificate',
        totalAttendanceMinutes: 0,
        minAttendanceMinutes: 0,
        externalCompletionVerified: true,
      })
    ).toEqual({ allowed: true, reason: 'eligible' })
  })

  it('does not issue certificates for resource-only webinars', () => {
    expect(
      canIssueCertificate({
        verificationMode: 'resource_only',
        totalAttendanceMinutes: 999,
        minAttendanceMinutes: 0,
        externalCompletionVerified: true,
      })
    ).toEqual({ allowed: false, reason: 'not_certificate_bearing' })
  })
})

describe('createCertificateCode', () => {
  it('creates a deterministic Kleia certificate code', () => {
    expect(
      createCertificateCode(
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        new Date('2026-08-31T12:00:00.000Z')
      )
    ).toMatch(/^KLEIA-[A-F0-9]{12}$/)
  })
})
