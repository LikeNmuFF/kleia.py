import { getServiceClient } from '@/lib/supabase/service'

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

export async function logSecurityEvent({
  eventType,
  severity = 'low',
  sourceIp,
  userId,
  challengeId,
  details = {},
}: {
  eventType: string
  severity?: SecuritySeverity
  sourceIp?: string | null
  userId?: string | null
  challengeId?: string | null
  details?: Record<string, unknown>
}) {
  try {
    const supabase = getServiceClient()
    await supabase.from('security_events').insert({
      event_type: eventType,
      severity,
      source_ip: sourceIp ?? null,
      user_id: userId ?? null,
      challenge_id: challengeId ?? null,
      details,
    })
  } catch {
    // Security logging must never break the request
  }
}