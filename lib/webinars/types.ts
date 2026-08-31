export type WebinarProviderType = 'internal' | 'dict' | 'school' | 'partner' | 'other'

export type WebinarVerificationMode =
  | 'internal_attendance'
  | 'external_certificate'
  | 'resource_only'

export type WebinarSkillCategory =
  | 'learn'
  | 'ctf'
  | 'regexGolf'
  | 'dailyCipher'
  | 'career'
  | 'other'

export interface CertificateEligibilityInput {
  verificationMode: WebinarVerificationMode
  totalAttendanceMinutes: number
  minAttendanceMinutes: number
  externalCompletionVerified: boolean
}

export interface CertificateEligibility {
  allowed: boolean
  reason: 'eligible' | 'attendance_required' | 'external_verification_required' | 'not_certificate_bearing'
}

export interface Webinar {
  id: string
  creator_id: string
  title: string
  description: string | null
  provider_name: string
  provider_type: WebinarProviderType
  verification_mode: WebinarVerificationMode
  external_url: string | null
  capacity: number | null
  min_attendance_minutes: number
  starts_at: string
  ends_at: string | null
  skill_category: WebinarSkillCategory
  certificate_title: string | null
  is_active: boolean
  created_at: string
  registration_count?: number
  my_registration?: WebinarRegistration | null
  my_certificate?: WebinarCertificate | null
}

export interface WebinarRegistration {
  webinar_id: string
  user_id: string
  status: 'registered' | 'cancelled' | 'completed'
  external_completion_url: string | null
  verified_by: string | null
  verified_at: string | null
  registered_at: string
  updated_at: string
  profiles?: {
    username: string
    avatar_url: string | null
  } | null
}

export interface WebinarAttendance {
  id: string
  webinar_id: string
  user_id: string
  recorded_by: string
  joined_at: string
  left_at: string | null
  duration_minutes: number
  created_at: string
}

export interface WebinarCertificate {
  id: string
  webinar_id: string
  user_id: string
  certificate_code: string
  issued_by: string
  issued_at: string
}
