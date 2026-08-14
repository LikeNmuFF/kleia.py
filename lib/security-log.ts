import { createClient as createServiceClient } from '@supabase/supabase-js'

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
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
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